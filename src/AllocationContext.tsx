import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { BudgetCategory, Invoice, Allocation } from './types';
import { MOCK_BUDGET, MOCK_INVOICES } from './mockData';

interface AllocationContextType {
  categories: BudgetCategory[];
  invoices: Invoice[];
  // Actions
  toggleCategory: (categoryId: string) => void;
  addAllocation: (lineItemId: string, allocation: Omit<Allocation, 'id'>) => void;
  removeAllocation: (lineItemId: string, allocationId: string) => void;
  updateAllocationAmount: (lineItemId: string, allocationId: string, amount: number) => void;
  updateAllocationMode: (lineItemId: string, allocationId: string, mode: 'fixed' | 'percentage', invoiceAmount: number, percentage?: number) => void;
  updateInvoiceSummary: (invoiceId: string, summary: string) => void;
  // Computed
  totalThisDraw: number;
  totalBudgeted: number;
  totalAvailable: number;
}

const AllocationContext = createContext<AllocationContextType | null>(null);

let allocIdCounter = 0;

export function AllocationProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<BudgetCategory[]>(() =>
    JSON.parse(JSON.stringify(MOCK_BUDGET))
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    JSON.parse(JSON.stringify(MOCK_INVOICES))
  );

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
    setCategories(prev =>
      prev.map(cat => ({
        ...cat,
        lineItems: cat.lineItems.map(li => {
          if (li.id !== lineItemId) return li;
          return {
            ...li,
            allocations: li.allocations.filter(a => a.id !== allocationId),
          };
        }),
      }))
    );
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
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId ? { ...inv, aiSummary: summary } : inv
      )
    );
  }, []);

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

  return (
    <AllocationContext.Provider
      value={{
        categories,
        invoices,
        toggleCategory,
        addAllocation,
        removeAllocation,
        updateAllocationAmount,
        updateAllocationMode,
        updateInvoiceSummary,
        totalThisDraw,
        totalBudgeted,
        totalAvailable,
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
