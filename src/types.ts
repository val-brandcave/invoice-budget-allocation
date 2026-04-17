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

export interface Attachment {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'image';
  url: string;
  pageCount?: number; // PDF only
}

export interface Invoice {
  id: string;
  vendorName: string;
  invoiceNumber: string;
  amount: number;
  receivedDate: string;
  aiSummary: string;
  subItems: InvoiceSubItem[];
  attachments: Attachment[];
}

export interface InvoiceSubItem {
  id: string;
  description: string;
  amount: number;
  suggestedLineItemId?: string;
  suggestedConfidence?: number; // 0-1
}

// === Stepper Types ===

export type FlowStep = 'review' | 'allocate' | 'summary';

export interface DraftPaymentRequest {
  id: string;
  prNumber: string;
  invoiceCount: number;
  totalAmount: number;
  status: 'draft' | 'queued';
  scheduledDate?: string;
}

// P8: Pending Change Order for over-budget line items
// A15-1: Changed from per-line-item to per-invoice COs
export interface PendingChangeOrder {
  id: string;
  coNumber: string; // e.g., "CO-1001"
  invoiceId: string; // A15-1: NEW - The invoice that caused this overage
  lineItemId: string; // Which line item went over budget
  amount: number; // This invoice's portion of the overage
  reason: string; // Reason specific to this invoice
  // Invoice context for display
  vendorName: string;
  invoiceNumber: string;
  createdAt: string;
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

// CO status for an invoice: checks if any allocations go to over-budget lines
export type InvoiceCOStatus = 'none' | 'needs_co' | 'has_co';

// A15-1: Updated to check for per-invoice COs
export function getInvoiceCOStatus(
  invoice: Invoice,
  allCategories: BudgetCategory[],
  pendingChangeOrders: PendingChangeOrder[]
): { status: InvoiceCOStatus; overBudgetCount: number; coCount: number; coNumbers: string[] } {
  // Find all line items where this invoice has allocations that cause overage
  const overBudgetLineItems: { lineItemId: string; overAmount: number }[] = [];

  for (const cat of allCategories) {
    for (const li of cat.lineItems) {
      // Check if this invoice has allocations on this line
      const invoiceAllocations = li.allocations.filter(a => a.invoiceId === invoice.id);
      if (invoiceAllocations.length === 0) continue;

      const thisDraw = li.allocations.reduce((sum, a) => sum + a.amount, 0);
      const available = li.budgeted - li.priorDraws - thisDraw;

      if (available < 0) {
        // This line is over budget - check if this invoice's allocation contributed
        // Calculate running total to see if THIS invoice pushed it over
        let runningTotal = li.priorDraws;
        let thisInvoiceCausedOverage = false;

        for (const alloc of li.allocations) {
          const wasUnder = runningTotal <= li.budgeted;
          runningTotal += alloc.amount;
          const nowOver = runningTotal > li.budgeted;

          if (alloc.invoiceId === invoice.id && wasUnder && nowOver) {
            thisInvoiceCausedOverage = true;
          } else if (alloc.invoiceId === invoice.id && !wasUnder) {
            // Line was already over, this invoice is adding to existing overage
            thisInvoiceCausedOverage = true;
          }
        }

        if (thisInvoiceCausedOverage) {
          overBudgetLineItems.push({ lineItemId: li.id, overAmount: Math.abs(available) });
        }
      }
    }
  }

  if (overBudgetLineItems.length === 0) {
    return { status: 'none', overBudgetCount: 0, coCount: 0, coNumbers: [] };
  }

  // A15-1: Check for per-invoice COs (now filtered by invoiceId)
  const coNumbers: string[] = [];
  let coCount = 0;

  for (const item of overBudgetLineItems) {
    const co = pendingChangeOrders.find(
      co => co.lineItemId === item.lineItemId && co.invoiceId === invoice.id
    );
    if (co) {
      coCount++;
      coNumbers.push(co.coNumber);
    }
  }

  const status: InvoiceCOStatus = coCount >= overBudgetLineItems.length ? 'has_co' : 'needs_co';
  return { status, overBudgetCount: overBudgetLineItems.length, coCount, coNumbers };
}
