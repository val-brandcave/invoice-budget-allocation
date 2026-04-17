import type { BudgetCategory, Invoice, DraftPaymentRequest } from './types';

export const MOCK_BUDGET: BudgetCategory[] = [
  {
    id: 'cat-1',
    number: '1.0',
    name: 'General Requirements',
    expanded: true,
    lineItems: [
      { id: 'li-1-1', number: '1.1', description: 'Pre-Construction / Admin', budgeted: 25000, priorDraws: 10000, allocations: [] },
      { id: 'li-1-2', number: '1.2', description: 'Permits & Fees', budgeted: 15000, priorDraws: 7000, allocations: [] },
      { id: 'li-1-3', number: '1.3', description: 'Insurance', budgeted: 8000, priorDraws: 4000, allocations: [] },
      { id: 'li-1-4', number: '1.4', description: 'Surveys & Engineering', budgeted: 12000, priorDraws: 12000, allocations: [] },
    ],
  },
  {
    id: 'cat-2',
    number: '2.0',
    name: 'Site Work',
    expanded: true,
    lineItems: [
      { id: 'li-2-1', number: '2.1', description: 'Grading & Excavation', budgeted: 45000, priorDraws: 28000, allocations: [] },
      { id: 'li-2-2', number: '2.2', description: 'Utilities Connections', budgeted: 18000, priorDraws: 6000, allocations: [] },
      { id: 'li-2-3', number: '2.3', description: 'Landscaping', budgeted: 22000, priorDraws: 0, allocations: [] },
      { id: 'li-2-4', number: '2.4', description: 'Fencing & Barriers', budgeted: 8000, priorDraws: 3000, allocations: [] },
    ],
  },
  {
    id: 'cat-3',
    number: '3.0',
    name: 'Structural',
    expanded: true,
    lineItems: [
      { id: 'li-3-1', number: '3.1', description: 'Concrete & Foundation', budgeted: 68000, priorDraws: 45000, allocations: [] },
      { id: 'li-3-2', number: '3.2', description: 'Framing / Rough Carpentry', budgeted: 85000, priorDraws: 42000, allocations: [] },
      { id: 'li-3-3', number: '3.3', description: 'Structural Steel', budgeted: 32000, priorDraws: 22000, allocations: [] },
      { id: 'li-3-4', number: '3.4', description: 'Trusses & Beams', budgeted: 28000, priorDraws: 18000, allocations: [] },
    ],
  },
  {
    id: 'cat-4',
    number: '4.0',
    name: 'Mechanical',
    expanded: true,
    lineItems: [
      { id: 'li-4-1', number: '4.1', description: 'HVAC Systems', budgeted: 55000, priorDraws: 20000, allocations: [] },
      { id: 'li-4-2', number: '4.2', description: 'Plumbing', budgeted: 42000, priorDraws: 15000, allocations: [] },
      { id: 'li-4-3', number: '4.3', description: 'Fire Protection / Sprinklers', budgeted: 24000, priorDraws: 8000, allocations: [] },
    ],
  },
  {
    id: 'cat-5',
    number: '5.0',
    name: 'Electrical',
    expanded: true,
    lineItems: [
      { id: 'li-5-1', number: '5.1', description: 'Electrical — Main', budgeted: 65000, priorDraws: 30000, allocations: [] },
      { id: 'li-5-2', number: '5.2', description: 'Low Voltage / Data', budgeted: 18000, priorDraws: 5000, allocations: [] },
      { id: 'li-5-3', number: '5.3', description: 'Generator / Backup', budgeted: 14000, priorDraws: 0, allocations: [] },
    ],
  },
  {
    id: 'cat-6',
    number: '6.0',
    name: 'Exterior Envelope',
    expanded: false,
    lineItems: [
      { id: 'li-6-1', number: '6.1', description: 'Windows & Doors', budgeted: 48000, priorDraws: 24000, allocations: [] },
      { id: 'li-6-2', number: '6.2', description: 'Roofing', budgeted: 38000, priorDraws: 12000, allocations: [] },
      { id: 'li-6-3', number: '6.3', description: 'Siding / Exterior Cladding', budgeted: 32000, priorDraws: 10000, allocations: [] },
      { id: 'li-6-4', number: '6.4', description: 'Waterproofing', budgeted: 15000, priorDraws: 8000, allocations: [] },
    ],
  },
  {
    id: 'cat-7',
    number: '7.0',
    name: 'Interior Finishes',
    expanded: false,
    lineItems: [
      { id: 'li-7-1', number: '7.1', description: 'Drywall & Plaster', budgeted: 35000, priorDraws: 10000, allocations: [] },
      { id: 'li-7-2', number: '7.2', description: 'Flooring', budgeted: 42000, priorDraws: 0, allocations: [] },
      { id: 'li-7-3', number: '7.3', description: 'Cabinets & Millwork', budgeted: 55000, priorDraws: 0, allocations: [] },
      { id: 'li-7-4', number: '7.4', description: 'Countertops', budgeted: 28000, priorDraws: 0, allocations: [] },
      { id: 'li-7-5', number: '7.5', description: 'Paint & Wall Finishes', budgeted: 18000, priorDraws: 0, allocations: [] },
      { id: 'li-7-6', number: '7.6', description: 'Tile & Stone', budgeted: 22000, priorDraws: 0, allocations: [] },
    ],
  },
  {
    id: 'cat-8',
    number: '8.0',
    name: 'General / Overhead',
    expanded: false,
    lineItems: [
      { id: 'li-8-1', number: '8.1', description: 'Site Cleanup', budgeted: 12000, priorDraws: 4000, allocations: [] },
      { id: 'li-8-2', number: '8.2', description: 'Temporary Facilities', budgeted: 8000, priorDraws: 3000, allocations: [] },
      { id: 'li-8-3', number: '8.3', description: 'Contractor\'s Fee', budgeted: 45000, priorDraws: 20000, allocations: [] },
    ],
  },
  {
    id: 'cat-contingency',
    number: '9.0',
    name: 'Contingency',
    expanded: true,
    lineItems: [
      { id: 'li-contingency', number: '9.1', description: 'General Contingency', budgeted: 35000, priorDraws: 5000, allocations: [] },
    ],
  },
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    vendorName: 'Rivera Electric',
    invoiceNumber: 'INV-1001',
    amount: 12000,
    receivedDate: '2026-03-28',
    aiSummary: 'Electrical rough-in work and material charges for main panel upgrade',
    subItems: [
      { id: 'si-1-1', description: 'Construction Management', amount: 10000, suggestedLineItemId: 'li-5-1', suggestedConfidence: 0.82 },
      { id: 'si-1-2', description: 'Materials & Supplies', amount: 1500, suggestedLineItemId: 'li-5-1', suggestedConfidence: 0.75 },
      { id: 'si-1-3', description: 'Cleanup & Disposal', amount: 500, suggestedLineItemId: 'li-8-1', suggestedConfidence: 0.90 },
    ],
    attachments: [
      { id: 'att-1-1', fileName: 'Invoice-1001.pdf', fileType: 'pdf', url: '/invoice-sample.jpg', pageCount: 2 },
      { id: 'att-1-2', fileName: 'Panel-install.jpg', fileType: 'image', url: '/invoice-photo-1.jpg' },
      { id: 'att-1-3', fileName: 'Wiring-closeup.jpg', fileType: 'image', url: '/invoice-photo-2.jpg' },
    ],
  },
  {
    id: 'inv-2',
    vendorName: 'Summit Framing Co',
    invoiceNumber: 'INV-1002',
    amount: 8323,
    receivedDate: '2026-03-29',
    aiSummary: 'Second-floor framing completion and structural header installation',
    subItems: [
      { id: 'si-2-1', description: 'Framing Labor & Materials', amount: 8323, suggestedLineItemId: 'li-3-2', suggestedConfidence: 0.95 },
    ],
    attachments: [
      { id: 'att-2-1', fileName: 'Framing-invoice.jpg', fileType: 'image', url: '/invoice-photo-1.jpg' },
    ],
  },
  {
    id: 'inv-3',
    vendorName: 'Apex HVAC Solutions',
    invoiceNumber: 'INV-1003',
    amount: 7000,
    receivedDate: '2026-03-26',
    aiSummary: 'HVAC ductwork installation for zones 1-3 plus condensing unit',
    subItems: [
      { id: 'si-3-1', description: 'Equipment (Condensing Unit)', amount: 5000, suggestedLineItemId: 'li-4-1', suggestedConfidence: 0.92 },
      { id: 'si-3-2', description: 'Installation Labor', amount: 2000, suggestedLineItemId: 'li-4-1', suggestedConfidence: 0.88 },
    ],
    attachments: [
      { id: 'att-3-1', fileName: 'HVAC-Invoice.pdf', fileType: 'pdf', url: '/invoice-sample.jpg', pageCount: 1 },
      { id: 'att-3-2', fileName: 'Condenser-unit.jpg', fileType: 'image', url: '/invoice-photo-2.jpg' },
      { id: 'att-3-3', fileName: 'Ductwork-progress.jpg', fileType: 'image', url: '/invoice-photo-1.jpg' },
    ],
  },
  {
    id: 'inv-4',
    vendorName: 'AquaFlow Plumbing',
    invoiceNumber: 'INV-1004',
    amount: 12990,
    receivedDate: '2026-03-30',
    aiSummary: 'Rough-in plumbing for bathrooms 1-3, kitchen main line, fixture delivery',
    subItems: [
      { id: 'si-4-1', description: 'Rough-In Plumbing', amount: 8000, suggestedLineItemId: 'li-4-2', suggestedConfidence: 0.91 },
      { id: 'si-4-2', description: 'Fixtures & Fittings', amount: 3500, suggestedLineItemId: 'li-4-2', suggestedConfidence: 0.85 },
      { id: 'si-4-3', description: 'Pressure Testing', amount: 1490, suggestedLineItemId: 'li-4-2', suggestedConfidence: 0.78 },
    ],
    attachments: [
      { id: 'att-4-1', fileName: 'Plumbing-Invoice.pdf', fileType: 'pdf', url: '/invoice-sample.jpg', pageCount: 1 },
    ],
  },
  {
    id: 'inv-5',
    vendorName: 'Legacy Roofing Inc',
    invoiceNumber: 'INV-1005',
    amount: 5500,
    receivedDate: '2026-03-31',
    aiSummary: 'Underlayment and flashing installation, progress billing',
    subItems: [
      { id: 'si-5-1', description: 'Roofing — Progress Billing', amount: 5500, suggestedLineItemId: 'li-6-2', suggestedConfidence: 0.97 },
    ],
    attachments: [
      { id: 'att-5-1', fileName: 'Roofing-receipt.jpg', fileType: 'image', url: '/invoice-photo-2.jpg' },
      { id: 'att-5-2', fileName: 'Flashing-install.jpg', fileType: 'image', url: '/invoice-photo-1.jpg' },
    ],
  },
  {
    id: 'inv-6',
    vendorName: 'Hill Plumbing Co',
    invoiceNumber: 'INV-1006',
    amount: 8323,
    receivedDate: '2026-04-01',
    aiSummary: 'Fire sprinkler rough-in for first and second floors',
    subItems: [
      { id: 'si-6-1', description: 'Sprinkler Materials', amount: 5000, suggestedLineItemId: 'li-4-3', suggestedConfidence: 0.87 },
      { id: 'si-6-2', description: 'Installation Labor', amount: 3323, suggestedLineItemId: 'li-4-3', suggestedConfidence: 0.84 },
    ],
    attachments: [
      { id: 'att-6-1', fileName: 'Sprinkler-Invoice.pdf', fileType: 'pdf', url: '/invoice-sample.jpg', pageCount: 1 },
      { id: 'att-6-2', fileName: 'Sprinkler-rough-in.jpg', fileType: 'image', url: '/invoice-photo-1.jpg' },
    ],
  },
  {
    id: 'inv-7',
    vendorName: 'Bright Windows LLC',
    invoiceNumber: 'INV-1007',
    amount: 14200,
    receivedDate: '2026-04-02',
    aiSummary: 'Custom window installation for second floor bedrooms and hallway',
    subItems: [
      { id: 'si-7-1', description: 'Window Units (6x)', amount: 9800, suggestedLineItemId: 'li-6-1', suggestedConfidence: 0.93 },
      { id: 'si-7-2', description: 'Installation Labor', amount: 4400, suggestedLineItemId: 'li-6-1', suggestedConfidence: 0.90 },
    ],
    attachments: [
      { id: 'att-7-1', fileName: 'Window-Invoice.pdf', fileType: 'pdf', url: '/invoice-sample.jpg', pageCount: 1 },
    ],
  },
  {
    id: 'inv-8',
    vendorName: 'Greystone Concrete',
    invoiceNumber: 'INV-1008',
    amount: 6750,
    receivedDate: '2026-04-03',
    aiSummary: 'Retaining wall pour and patio slab for rear yard area',
    subItems: [
      { id: 'si-8-1', description: 'Concrete & Rebar', amount: 4250, suggestedLineItemId: 'li-3-1', suggestedConfidence: 0.88 },
      { id: 'si-8-2', description: 'Labor — Pour & Finish', amount: 2500, suggestedLineItemId: 'li-3-1', suggestedConfidence: 0.85 },
    ],
    attachments: [
      { id: 'att-8-1', fileName: 'Concrete-receipt.jpg', fileType: 'image', url: '/invoice-photo-2.jpg' },
    ],
  },
  {
    id: 'inv-9',
    vendorName: 'SafeGuard Fire Systems',
    invoiceNumber: 'INV-1009',
    amount: 3400,
    receivedDate: '2026-04-04',
    aiSummary: 'Fire alarm panel installation and zone wiring for main floor',
    subItems: [
      { id: 'si-9-1', description: 'Alarm Panel & Equipment', amount: 2200, suggestedLineItemId: 'li-4-3', suggestedConfidence: 0.80 },
      { id: 'si-9-2', description: 'Wiring & Install', amount: 1200, suggestedLineItemId: 'li-5-2', suggestedConfidence: 0.72 },
    ],
    attachments: [
      { id: 'att-9-1', fileName: 'FireAlarm-Invoice.pdf', fileType: 'pdf', url: '/invoice-sample.jpg', pageCount: 1 },
    ],
  },
];

// First 6 invoices are pre-selected; inv-7, inv-8, inv-9 are available but not initially selected
export const INITIAL_SELECTED_IDS = ['inv-1', 'inv-2', 'inv-3', 'inv-4', 'inv-5', 'inv-6'];

export const MOCK_DRAFT_PRS: DraftPaymentRequest[] = [
  {
    id: 'pr-draft-1',
    prNumber: 'PR-003',
    invoiceCount: 3,
    totalAmount: 18450,
    status: 'queued',
    scheduledDate: '2026-04-10',
  },
  {
    id: 'pr-draft-2',
    prNumber: 'PR-002',
    invoiceCount: 5,
    totalAmount: 32800,
    status: 'draft',
  },
  {
    id: 'pr-draft-3',
    prNumber: 'PR-001',
    invoiceCount: 2,
    totalAmount: 9200,
    status: 'draft',
  },
];
