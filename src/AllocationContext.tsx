import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { BudgetCategory, Invoice, Allocation } from './types';
import { getInvoiceAllocatedAmount, getSubItemAllocatedAmount } from './types';
import { MOCK_BUDGET, MOCK_INVOICES } from './mockData';

interface AllocationContextType {
  categories: BudgetCategory[];
  invoices: Invoice[];
  // Actions
  toggleCategory: (categoryId: string) => void;
  addAllocation: (lineItemId: string, allocation: Omit<Allocation, 'id'>) => void;
  removeAllocation: (lineItemId: string, allocationId: string) => void;
  updateAllocationAmount: (lineItemId: string, allocationId: string, amount: number) => void;
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
  const invoices = MOCK_INVOICES;

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

  const getRemainingForInvoice = useCallback(
    (invoiceId: string) => {
      const inv = invoices.find(i => i.id === invoiceId);
      if (!inv) return 0;
      return inv.amount - getInvoiceAllocatedAmount(inv, categories);
    },
    [categories, invoices]
  );

  const getRemainingForSubItem = useCallback(
    (subItemId: string, subItemAmount: number) => {
      return subItemAmount - getSubItemAllocatedAmount(subItemId, categories);
    },
    [categories]
  );

  return (
    <AllocationContext.Provider
      value={{
        categories,
        invoices,
        toggleCategory,
        addAllocation,
        removeAllocation,
        updateAllocationAmount,
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
