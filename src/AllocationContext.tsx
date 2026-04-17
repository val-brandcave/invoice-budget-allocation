import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { BudgetCategory, Invoice, Allocation, FlowStep, DraftPaymentRequest, PendingChangeOrder } from './types';
import { MOCK_BUDGET, MOCK_INVOICES, INITIAL_SELECTED_IDS, MOCK_DRAFT_PRS } from './mockData';

interface AllocationContextType {
  categories: BudgetCategory[];
  invoices: Invoice[];
  // Stepper
  step: FlowStep;
  setStep: (step: FlowStep) => void;
  goNext: () => void;
  goBack: () => void;
  canProceed: boolean;
  // Completion modal
  showCompletionModal: boolean;
  setShowCompletionModal: (show: boolean) => void;
  completeFlow: () => void;
  // Invoice selection (Step 1)
  allInvoices: Invoice[];
  selectedIds: Set<string>;
  toggleInvoice: (id: string) => void;
  selectedInvoices: Invoice[];
  selectedTotal: number;
  // PR assignment (now on Step 1)
  draftPRs: DraftPaymentRequest[];
  selectedPRId: string;
  setSelectedPRId: (id: string) => void;
  // Actions
  toggleCategory: (categoryId: string) => void;
  addAllocation: (lineItemId: string, allocation: Omit<Allocation, 'id'>) => void;
  removeAllocation: (lineItemId: string, allocationId: string) => void;
  clearInvoiceAllocations: (invoiceId: string) => void;
  updateAllocationAmount: (lineItemId: string, allocationId: string, amount: number) => void;
  updateAllocationMode: (lineItemId: string, allocationId: string, mode: 'fixed' | 'percentage', invoiceAmount: number, percentage?: number) => void;
  updateInvoiceSummary: (invoiceId: string, summary: string) => void;
  // P8: Pending Change Orders
  // A15-1: Updated to per-invoice COs
  pendingChangeOrders: PendingChangeOrder[];
  nextCONumber: string;
  createChangeOrder: (
    lineItemId: string,
    invoiceId: string,
    vendorName: string,
    invoiceNumber: string,
    amount: number,
    reason: string
  ) => void;
  removeChangeOrder: (changeOrderId: string) => void;
  getChangeOrderForLineItem: (lineItemId: string) => PendingChangeOrder | undefined;
  // A15-1: New helper to get CO for specific invoice+lineItem combo
  getChangeOrderForAllocation: (lineItemId: string, invoiceId: string) => PendingChangeOrder | undefined;
  // Get total CO amount already requested for a line item (across all invoices)
  getTotalCOAmountForLineItem: (lineItemId: string) => number;
  // Computed
  totalThisDraw: number;
  totalBudgeted: number;
  totalAvailable: number;
  allInvoicesAllocated: boolean;
}

const AllocationContext = createContext<AllocationContextType | null>(null);

let allocIdCounter = 0;
let coIdCounter = 0;
let coNumberCounter = 1000; // CO numbers start at CO-1001

export function AllocationProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<BudgetCategory[]>(() =>
    JSON.parse(JSON.stringify(MOCK_BUDGET))
  );
  const [allInvoices, setAllInvoices] = useState<Invoice[]>(() =>
    JSON.parse(JSON.stringify(MOCK_INVOICES))
  );
  const [step, setStep] = useState<FlowStep>('allocate');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(INITIAL_SELECTED_IDS));
  const [selectedPRId, setSelectedPRId] = useState<string>('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [pendingChangeOrders, setPendingChangeOrders] = useState<PendingChangeOrder[]>([]);
  const draftPRs = MOCK_DRAFT_PRS;

  const selectedInvoices = useMemo(
    () => allInvoices.filter(inv => selectedIds.has(inv.id)),
    [allInvoices, selectedIds]
  );

  const selectedTotal = useMemo(
    () => selectedInvoices.reduce((s, inv) => s + inv.amount, 0),
    [selectedInvoices]
  );

  // "invoices" exposed to step 2 is only the selected ones
  const invoices = selectedInvoices;

  const toggleInvoice = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleCategory = useCallback((categoryId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat
      )
    );
  }, []);

  const addAllocation = useCallback((lineItemId: string, alloc: Omit<Allocation, 'id'>) => {
    const id = `alloc-${++allocIdCounter}`;
    setCategories(prev =>
      prev.map(cat => ({
        ...cat,
        lineItems: cat.lineItems.map(li => {
          if (li.id !== lineItemId) return li;
          return {
            ...li,
            allocations: [...li.allocations, { ...alloc, id }],
          };
        }),
      }))
    );
  }, []);

  const removeAllocation = useCallback((lineItemId: string, allocationId: string) => {
    // First, find the allocation to get invoiceId for CO cleanup
    let invoiceIdToClean: string | null = null;
    setCategories(prev => {
      // Find the invoiceId before removing
      for (const cat of prev) {
        const li = cat.lineItems.find(l => l.id === lineItemId);
        if (li) {
          const alloc = li.allocations.find(a => a.id === allocationId);
          if (alloc) {
            invoiceIdToClean = alloc.invoiceId;
            break;
          }
        }
      }

      return prev.map(cat => ({
        ...cat,
        lineItems: cat.lineItems.map(li => {
          if (li.id !== lineItemId) return li;
          return {
            ...li,
            allocations: li.allocations.filter(a => a.id !== allocationId),
          };
        }),
      }));
    });

    // Clean up any CO associated with this allocation
    if (invoiceIdToClean) {
      setPendingChangeOrders(prev =>
        prev.filter(co => !(co.lineItemId === lineItemId && co.invoiceId === invoiceIdToClean))
      );
    }
  }, []);

  const clearInvoiceAllocations = useCallback((invoiceId: string) => {
    setCategories(prev =>
      prev.map(cat => ({
        ...cat,
        lineItems: cat.lineItems.map(li => ({
          ...li,
          allocations: li.allocations.filter(a => a.invoiceId !== invoiceId),
        })),
      }))
    );
    // Also clean up any COs associated with this invoice
    setPendingChangeOrders(prev => prev.filter(co => co.invoiceId !== invoiceId));
  }, []);

  const updateAllocationAmount = useCallback(
    (lineItemId: string, allocationId: string, amount: number) => {
      setCategories(prev =>
        prev.map(cat => ({
          ...cat,
          lineItems: cat.lineItems.map(li => {
            if (li.id !== lineItemId) return li;
            return {
              ...li,
              allocations: li.allocations.map(a =>
                a.id === allocationId ? { ...a, amount } : a
              ),
            };
          }),
        }))
      );
    },
    []
  );

  // percentage is % of the INVOICE amount, not the budget line
  const updateAllocationMode = useCallback(
    (lineItemId: string, allocationId: string, mode: 'fixed' | 'percentage', invoiceAmount: number, percentage?: number) => {
      setCategories(prev =>
        prev.map(cat => ({
          ...cat,
          lineItems: cat.lineItems.map(li => {
            if (li.id !== lineItemId) return li;
            return {
              ...li,
              allocations: li.allocations.map(a => {
                if (a.id !== allocationId) return a;
                if (mode === 'percentage' && percentage !== undefined) {
                  const computedAmount = (percentage / 100) * invoiceAmount;
                  return { ...a, mode, percentage, amount: Math.round(computedAmount * 100) / 100 };
                }
                return { ...a, mode: 'fixed', percentage: undefined };
              }),
            };
          }),
        }))
      );
    },
    []
  );

  const updateInvoiceSummary = useCallback((invoiceId: string, summary: string) => {
    setAllInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId ? { ...inv, aiSummary: summary } : inv
      )
    );
  }, []);

  // P8: Create a change order for an over-budget line item
  // A15-1: Now per-invoice - requires invoiceId and invoice details
  const createChangeOrder = useCallback((
    lineItemId: string,
    invoiceId: string,
    vendorName: string,
    invoiceNumber: string,
    amount: number,
    reason: string
  ) => {
    const newCO: PendingChangeOrder = {
      id: `co-${++coIdCounter}`,
      coNumber: `CO-${++coNumberCounter}`,
      invoiceId,
      lineItemId,
      amount,
      reason,
      vendorName,
      invoiceNumber,
      createdAt: new Date().toISOString(),
    };

    setPendingChangeOrders(prev => [...prev, newCO]);
  }, []);

  // P8: Remove a pending change order
  const removeChangeOrder = useCallback((changeOrderId: string) => {
    setPendingChangeOrders(prev => prev.filter(co => co.id !== changeOrderId));
  }, []);

  // P8: Get the change order for a specific line item (if any)
  // A15-1: Returns first CO for line item (for backward compat display)
  const getChangeOrderForLineItem = useCallback((lineItemId: string) => {
    return pendingChangeOrders.find(co => co.lineItemId === lineItemId);
  }, [pendingChangeOrders]);

  // A15-1: Get CO for specific invoice+lineItem combo
  const getChangeOrderForAllocation = useCallback((lineItemId: string, invoiceId: string) => {
    return pendingChangeOrders.find(
      co => co.lineItemId === lineItemId && co.invoiceId === invoiceId
    );
  }, [pendingChangeOrders]);

  // Get total CO amount already requested for a line item (across all invoices)
  const getTotalCOAmountForLineItem = useCallback((lineItemId: string) => {
    return pendingChangeOrders
      .filter(co => co.lineItemId === lineItemId)
      .reduce((sum, co) => sum + co.amount, 0);
  }, [pendingChangeOrders]);

  const { totalThisDraw, totalBudgeted, totalAvailable } = useMemo(() => {
    let draw = 0, budgeted = 0, available = 0;
    for (const cat of categories) {
      for (const li of cat.lineItems) {
        const thisDraw = li.allocations.reduce((s, a) => s + a.amount, 0);
        budgeted += li.budgeted;
        available += li.budgeted - li.priorDraws - thisDraw;
        draw += thisDraw;
      }
    }
    return { totalThisDraw: draw, totalBudgeted: budgeted, totalAvailable: available };
  }, [categories]);

  const allInvoicesAllocated = useMemo(() => {
    return selectedInvoices.every(inv => {
      let allocated = 0;
      for (const cat of categories) {
        for (const li of cat.lineItems) {
          for (const a of li.allocations) {
            if (a.invoiceId === inv.id) allocated += a.amount;
          }
        }
      }
      return Math.abs(allocated - inv.amount) < 0.01 || allocated >= inv.amount;
    });
  }, [selectedInvoices, categories]);

  // Single-step flow: only check if all invoices are allocated
  const canProceed = useMemo(() => {
    return allInvoicesAllocated;
  }, [allInvoicesAllocated]);

  // Auto-select first PR if none selected
  React.useEffect(() => {
    if (!selectedPRId && draftPRs.length > 0) {
      setSelectedPRId(draftPRs[0].id);
    } else if (!selectedPRId && draftPRs.length === 0) {
      setSelectedPRId('new');
    }
  }, [draftPRs, selectedPRId]);

  // Single-step flow: next shows the completion modal
  const goNext = useCallback(() => {
    setShowCompletionModal(true);
  }, []);

  // Single-step flow: no back navigation needed
  const goBack = useCallback(() => {
    // No-op in single-step flow
  }, []);

  const completeFlow = useCallback(() => {
    // This would submit the PR in a real app
    setShowCompletionModal(false);
    // For now, just close the modal
  }, []);

  return (
    <AllocationContext.Provider
      value={{
        categories,
        invoices,
        step,
        setStep,
        goNext,
        goBack,
        canProceed,
        showCompletionModal,
        setShowCompletionModal,
        completeFlow,
        allInvoices,
        selectedIds,
        toggleInvoice,
        selectedInvoices,
        selectedTotal,
        draftPRs,
        selectedPRId,
        setSelectedPRId,
        toggleCategory,
        addAllocation,
        removeAllocation,
        clearInvoiceAllocations,
        updateAllocationAmount,
        updateAllocationMode,
        updateInvoiceSummary,
        pendingChangeOrders,
        nextCONumber: `CO-${coNumberCounter + 1}`,
        createChangeOrder,
        removeChangeOrder,
        getChangeOrderForLineItem,
        getChangeOrderForAllocation,
        getTotalCOAmountForLineItem,
        totalThisDraw,
        totalBudgeted,
        totalAvailable,
        allInvoicesAllocated,
      }}
    >
      {children}
    </AllocationContext.Provider>
  );
}

export function useAllocation() {
  const ctx = useContext(AllocationContext);
  if (!ctx) throw new Error('useAllocation must be used within AllocationProvider');
  return ctx;
}
