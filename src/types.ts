// === Data Model Types ===

export interface BudgetCategory {
  id: string;
  number: string;        // "1.0", "2.0"
  name: string;
  expanded: boolean;
  lineItems: BudgetLineItem[];
}

export interface BudgetLineItem {
  id: string;
  number: string;        // "1.1", "1.2"
  description: string;
  budgeted: number;
  priorDraws: number;    // Amount drawn in prior payment requests
  allocations: Allocation[];
}

export interface Allocation {
  id: string;
  invoiceId: string;
  invoiceSubItemId?: string;
  vendorName: string;
  invoiceNumber: string;
  description: string;   // Sub-item description or "Full Invoice"
  amount: number;
  mode: 'fixed' | 'percentage';
  percentage?: number;
}

export interface Invoice {
  id: string;
  vendorName: string;
  invoiceNumber: string;
  amount: number;
  receivedDate: string;
  aiSummary: string;
  subItems: InvoiceSubItem[];
}

export interface InvoiceSubItem {
  id: string;
  description: string;
  amount: number;
  suggestedLineItemId?: string;
  suggestedConfidence?: number; // 0-1
}

// === Drag Types ===

export type DragItemType = 'invoice' | 'sub-item';

export interface DragData {
  type: DragItemType;
  invoiceId: string;
  subItemId?: string;
  vendorName: string;
  invoiceNumber: string;
  description: string;
  amount: number;          // Full amount of this item
  remainingAmount: number; // Amount not yet allocated
}

// === Computed helpers ===

export function getInvoiceAllocatedAmount(invoice: Invoice, allCategories: BudgetCategory[]): number {
  let total = 0;
  for (const cat of allCategories) {
    for (const li of cat.lineItems) {
      for (const a of li.allocations) {
        if (a.invoiceId === invoice.id) {
          total += a.amount;
        }
      }
    }
  }
  return total;
}

export function getSubItemAllocatedAmount(subItemId: string, allCategories: BudgetCategory[]): number {
  let total = 0;
  for (const cat of allCategories) {
    for (const li of cat.lineItems) {
      for (const a of li.allocations) {
        if (a.invoiceSubItemId === subItemId) {
          total += a.amount;
        }
      }
    }
  }
  return total;
}

export function getSubItemAllocations(subItemId: string, allCategories: BudgetCategory[]): { lineItemNumber: string; lineItemDesc: string; amount: number }[] {
  const result: { lineItemNumber: string; lineItemDesc: string; amount: number }[] = [];
  for (const cat of allCategories) {
    for (const li of cat.lineItems) {
      for (const a of li.allocations) {
        if (a.invoiceSubItemId === subItemId) {
          result.push({ lineItemNumber: li.number, lineItemDesc: li.description, amount: a.amount });
        }
      }
    }
  }
  return result;
}

export function getLineItemThisDraw(lineItem: BudgetLineItem): number {
  return lineItem.allocations.reduce((sum, a) => sum + a.amount, 0);
}

export function getLineItemAvailable(lineItem: BudgetLineItem): number {
  return lineItem.budgeted - lineItem.priorDraws - getLineItemThisDraw(lineItem);
}

export function getInvoiceStatus(invoice: Invoice, allCategories: BudgetCategory[]): 'unallocated' | 'partial' | 'fully_allocated' {
  const allocated = getInvoiceAllocatedAmount(invoice, allCategories);
  if (allocated === 0) return 'unallocated';
  if (allocated >= invoice.amount - 0.01) return 'fully_allocated';
  return 'partial';
}

export function getInvoiceProgress(invoice: Invoice, allCategories: BudgetCategory[]): number {
  const allocated = getInvoiceAllocatedAmount(invoice, allCategories);
  if (invoice.amount === 0) return 100;
  return Math.min(100, Math.round((allocated / invoice.amount) * 100));
}
