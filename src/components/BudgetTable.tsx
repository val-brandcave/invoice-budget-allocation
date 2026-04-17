import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Collapse,
  Select,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Link,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useDroppable } from '@dnd-kit/core';
import { useAllocation } from '../AllocationContext';
import type { BudgetCategory, BudgetLineItem, Allocation, PendingChangeOrder } from '../types';
import { getLineItemThisDraw, getLineItemAvailable } from '../types';

// Shared grid template for consistent column alignment
const GRID_COLUMNS = '52px 1fr 110px 110px 120px';

// === Format helpers ===
function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtFull(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

// === Droppable Line Item Row ===
// A15-1: Refactored - CO logic moved to AllocationRow level
function LineItemRow({ lineItem }: { lineItem: BudgetLineItem }) {
  const { invoices, removeAllocation, updateAllocationAmount, updateAllocationMode, getChangeOrderForLineItem, getChangeOrderForAllocation, createChangeOrder, removeChangeOrder, nextCONumber, pendingChangeOrders, getTotalCOAmountForLineItem } = useAllocation();
  const thisDraw = getLineItemThisDraw(lineItem);
  const available = getLineItemAvailable(lineItem);
  const isOverBudget = available < 0;

  // Calculate total overage and total CO amount for this line item
  const totalOverage = available < 0 ? Math.abs(available) : 0;
  const totalCOAmount = getTotalCOAmountForLineItem(lineItem.id);

  // Overage is covered if total COs >= total overage
  const allOveragesCovered = !isOverBudget || totalCOAmount >= totalOverage;

  // A15-1: Count how many COs exist for this line item
  const lineItemCOCount = pendingChangeOrders.filter(co => co.lineItemId === lineItem.id).length;

  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${lineItem.id}`,
    data: { lineItemId: lineItem.id },
  });

  // Determine row styling based on state
  // A15-1: Show error state only if over budget and not all overages covered
  const showErrorState = isOverBudget && !allOveragesCovered;

  return (
    <>
      <Box
        ref={setNodeRef}
        sx={{
          display: 'grid',
          gridTemplateColumns: GRID_COLUMNS,
          alignItems: 'center',
          px: 2,
          py: 0.75,
          borderBottom: '1px solid',
          borderColor: isOver ? 'primary.main' : 'grey.200',
          bgcolor: isOver ? 'primary.lighter' : showErrorState ? 'error.lighter' : 'background.paper',
          borderLeft: isOver ? '3px solid' : showErrorState ? '3px solid' : '3px solid transparent',
          borderLeftColor: isOver ? 'primary.main' : showErrorState ? 'error.main' : 'transparent',
          transition: 'all 0.15s ease',
          '&:hover': {
            bgcolor: showErrorState ? 'error.lighter' : 'grey.50',
          },
        }}
      >
        <Typography variant="body2" color="text.secondary">{lineItem.number}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
          <Typography variant="body2">{lineItem.description}</Typography>
          {/* Show adjustment count badge at line level */}
          {lineItemCOCount > 0 && (
            <Chip
              label={lineItemCOCount === 1 ? 'Adjustment Requested' : `${lineItemCOCount} Adjustments`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                bgcolor: 'info.lighter',
                color: 'info.dark',
              }}
            />
          )}
        </Box>
        <Typography variant="body2" sx={{ textAlign: 'right' }}>{fmt(lineItem.budgeted)}</Typography>
        <Typography
          variant="body2"
          sx={{
            textAlign: 'right',
            color: showErrorState ? 'error.main' : allOveragesCovered && isOverBudget ? 'text.secondary' : 'text.primary',
            fontWeight: showErrorState ? 700 : 400,
            fontStyle: allOveragesCovered && isOverBudget ? 'italic' : 'normal',
          }}
        >
          {fmt(available)}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            textAlign: 'right',
            fontWeight: thisDraw > 0 ? 700 : 400,
            color: thisDraw > 0 ? 'primary.main' : 'text.secondary',
            pr: 0.5,
          }}
        >
          {thisDraw > 0 ? fmt(thisDraw) : '—'}
        </Typography>
      </Box>

      {/* Allocation sub-rows */}
      {/* A15-1: Each allocation row now handles its own CO if it causes overage */}
      {lineItem.allocations.map(alloc => {
        const inv = invoices.find(i => i.id === alloc.invoiceId);
        const invoiceAmount = inv?.amount ?? 0;
        // A15-1: Get CO specific to this allocation (invoice + line item)
        const allocCO = getChangeOrderForAllocation(lineItem.id, alloc.invoiceId);
        return (
          <AllocationRow
            key={alloc.id}
            allocation={alloc}
            lineItemId={lineItem.id}
            lineItemDescription={lineItem.description}
            invoiceAmount={invoiceAmount}
            isLineOverBudget={isOverBudget}
            lineItemBudgeted={lineItem.budgeted}
            lineItemPriorDraws={lineItem.priorDraws}
            lineItemThisDraw={thisDraw}
            onRemove={() => removeAllocation(lineItem.id, alloc.id)}
            onUpdateAmount={(amt) => updateAllocationAmount(lineItem.id, alloc.id, amt)}
            onUpdateMode={(mode, pct) => updateAllocationMode(lineItem.id, alloc.id, mode, invoiceAmount, pct)}
            pendingCO={allocCO}
            onCreateCO={createChangeOrder}
            onRemoveCO={removeChangeOrder}
            nextCONumber={nextCONumber}
            totalCOAmountForLineItem={getTotalCOAmountForLineItem(lineItem.id)}
          />
        );
      })}

      {/* A15-1: Over-budget hint moved to AllocationRow level */}
    </>
  );
}

// === Allocation Sub-Row ===
// A15-1: Completely refactored to handle per-invoice COs
function AllocationRow({
  allocation,
  lineItemId,
  lineItemDescription,
  invoiceAmount,
  isLineOverBudget,
  lineItemBudgeted,
  lineItemPriorDraws,
  lineItemThisDraw,
  onRemove,
  onUpdateAmount,
  onUpdateMode,
  pendingCO,
  onCreateCO,
  onRemoveCO,
  nextCONumber,
  totalCOAmountForLineItem,
}: {
  allocation: Allocation;
  lineItemId: string;
  lineItemDescription: string;
  invoiceAmount: number;
  isLineOverBudget: boolean;
  lineItemBudgeted: number;
  lineItemPriorDraws: number;
  lineItemThisDraw: number;
  onRemove: () => void;
  onUpdateAmount: (amount: number) => void;
  onUpdateMode: (mode: 'fixed' | 'percentage', percentage?: number) => void;
  pendingCO?: PendingChangeOrder;
  onCreateCO: (lineItemId: string, invoiceId: string, vendorName: string, invoiceNumber: string, amount: number, reason: string) => void;
  onRemoveCO: (coId: string) => void;
  nextCONumber: string;
  totalCOAmountForLineItem: number;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [editUnit, setEditUnit] = useState<'$' | '%'>('$');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectOpenRef = useRef(false);

  // A15-1: CO Modal state for this allocation
  const [coModalOpen, setCOModalOpen] = useState(false);
  const [coAmount, setCOAmount] = useState('');
  const [coReason, setCOReason] = useState('');

  const computedPct = invoiceAmount > 0
    ? Math.round((allocation.amount / invoiceAmount) * 100 * 100) / 100
    : 0;

  // A15-1: Calculate this allocation's portion of the overage
  const shortfall = lineItemBudgeted - lineItemPriorDraws - lineItemThisDraw;
  const totalOverageAmount = shortfall < 0 ? Math.abs(shortfall) : 0;

  // Calculate uncovered overage (total overage minus COs already requested for this line item)
  const uncoveredOverage = Math.max(0, totalOverageAmount - totalCOAmountForLineItem);

  // Does this allocation need a CO? Only if there's uncovered overage AND no CO for THIS allocation
  const needsCO = isLineOverBudget && uncoveredOverage > 0 && !pendingCO;
  const hasCO = !!pendingCO;

  const handleOpenCOModal = () => {
    // Pre-fill with remaining uncovered overage, not total overage
    setCOAmount(uncoveredOverage.toFixed(2));
    setCOReason('');
    setCOModalOpen(true);
  };

  const handleCreateCO = () => {
    const amount = parseFloat(coAmount);
    if (!isNaN(amount) && amount > 0 && coReason.trim()) {
      onCreateCO(
        lineItemId,
        allocation.invoiceId,
        allocation.vendorName,
        allocation.invoiceNumber,
        amount,
        coReason.trim()
      );
      setCOModalOpen(false);
    }
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleStartEdit = () => {
    if (allocation.mode === 'percentage') {
      setEditUnit('%');
      setEditValue((allocation.percentage ?? computedPct).toString());
    } else {
      setEditUnit('$');
      setEditValue(allocation.amount.toString());
    }
    setEditing(true);
  };

  const handleSave = () => {
    const cleaned = editValue.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed > 0) {
      if (editUnit === '%') {
        onUpdateMode('percentage', parsed);
      } else {
        onUpdateAmount(parsed);
        onUpdateMode('fixed');
      }
    }
    setEditing(false);
  };

  const handleUnitChange = (newUnit: '$' | '%') => {
    if (newUnit === editUnit) return;
    const cleaned = editValue.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);

    if (!isNaN(parsed) && parsed > 0) {
      if (newUnit === '%' && invoiceAmount > 0) {
        setEditValue((Math.round((parsed / invoiceAmount) * 100 * 100) / 100).toString());
      } else if (newUnit === '$') {
        setEditValue((Math.round((parsed / 100) * invoiceAmount * 100) / 100).toString());
      }
    }
    setEditUnit(newUnit);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '52px 1fr',
          alignItems: 'center',
          px: 2,
          py: 0.5,
          bgcolor: needsCO ? 'warning.lighter' : 'primary.lighter',
          borderBottom: '1px solid',
          borderColor: needsCO ? 'warning.light' : 'grey.100',
          borderLeft: needsCO ? '3px solid' : 'none',
          borderLeftColor: needsCO ? 'warning.main' : 'transparent',
          animation: 'slideIn 0.2s ease-out',
          '@keyframes slideIn': {
            from: { opacity: 0, transform: 'translateY(-8px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <Box />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2 }}>
          <Typography variant="caption" sx={{ color: needsCO ? 'warning.dark' : 'primary.main' }}>↳</Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }} noWrap>
            {allocation.vendorName}
          </Typography>
          <Chip
            label={allocation.invoiceNumber}
            size="small"
            sx={{ height: 20, fontSize: '0.7rem', bgcolor: needsCO ? 'warning.lighter' : 'primary.lighter', color: needsCO ? 'warning.dark' : 'primary.dark', flexShrink: 0 }}
          />

          {/* Show adjustment chip with delete for this specific allocation */}
          {hasCO && pendingCO && (
            <Chip
              label="Adjustment Requested"
              size="small"
              onDelete={() => onRemoveCO(pendingCO.id)}
              sx={{
                height: 18,
                fontSize: '0.6rem',
                fontWeight: 700,
                bgcolor: 'info.lighter',
                color: 'info.dark',
                flexShrink: 0,
                ml: -0.25,
                '& .MuiChip-deleteIcon': {
                  fontSize: 14,
                  color: 'info.main',
                  '&:hover': { color: 'info.dark' },
                },
              }}
            />
          )}

          {/* Over Budget indicator + explicit Request Adjustment link */}
          {needsCO && (
            <>
              <Chip
                icon={<ErrorOutlineIcon sx={{ fontSize: '14px !important' }} />}
                label="Over Budget"
                size="small"
                onClick={handleOpenCOModal}
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  bgcolor: 'warning.main',
                  color: 'warning.contrastText',
                  cursor: 'pointer',
                  flexShrink: 0,
                  '&:hover': { bgcolor: 'warning.dark' },
                  '& .MuiChip-icon': { color: 'warning.contrastText' },
                }}
              />
              <Link
                component="button"
                variant="caption"
                onClick={handleOpenCOModal}
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'warning.dark',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  flexShrink: 0,
                  '&:hover': { color: 'warning.main' },
                }}
              >
                Request Adjustment
              </Link>
            </>
          )}

          <Box sx={{ flex: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
            {editing ? (
              <Box
                ref={containerRef}
                onBlur={(e: React.FocusEvent) => {
                  const related = e.relatedTarget as Node | null;
                  if (containerRef.current?.contains(related)) return;
                  if (selectOpenRef.current) return;
                  setTimeout(() => {
                    if (selectOpenRef.current) return;
                    if (!containerRef.current?.contains(document.activeElement)) {
                      handleSave();
                    }
                  }, 150);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  overflow: 'hidden',
                  width: 150,
                  height: 30,
                }}
              >
                <Select
                  size="small"
                  variant="standard"
                  value={editUnit}
                  onChange={(e) => handleUnitChange(e.target.value as '$' | '%')}
                  disableUnderline
                  onOpen={() => { selectOpenRef.current = true; }}
                  onClose={() => {
                    selectOpenRef.current = false;
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  sx={{
                    minWidth: 36,
                    pl: 0.75,
                    '& .MuiSelect-select': {
                      py: 0,
                      pr: '16px !important',
                      pl: 0,
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      color: 'primary.main',
                    },
                    '& .MuiSelect-icon': {
                      fontSize: 16,
                      right: -2,
                      color: 'grey.400',
                    },
                  }}
                  MenuProps={{
                    PaperProps: { sx: { minWidth: 48 } },
                    disablePortal: false,
                  }}
                >
                  <MenuItem value="$" sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>$</MenuItem>
                  <MenuItem value="%" sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>%</MenuItem>
                </Select>
                <Box
                  sx={{
                    width: '1px',
                    height: 18,
                    bgcolor: 'grey.300',
                    flexShrink: 0,
                  }}
                />
                <Box
                  component="input"
                  ref={inputRef}
                  value={editValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSave()}
                  sx={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    bgcolor: 'transparent',
                    fontSize: '0.8125rem',
                    py: 0.5,
                    px: 0.75,
                    minWidth: 0,
                  }}
                />
              </Box>
            ) : (
              <Box
                onClick={handleStartEdit}
                sx={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 0.75,
                  cursor: 'pointer',
                  borderRadius: 0.5,
                  px: 0.5,
                  py: 0.25,
                  mx: -0.5,
                  '&:hover': { bgcolor: 'rgba(25, 57, 183, 0.06)' },
                  '&:hover .alloc-dollar': { textDecoration: 'underline' },
                }}
              >
                <Typography
                  className="alloc-dollar"
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: needsCO ? 'warning.dark' : 'primary.main',
                  }}
                >
                  {fmtFull(allocation.amount)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    color: 'grey.500',
                    fontWeight: 500,
                  }}
                >
                  {computedPct}%
                </Typography>
              </Box>
            )}

            <Tooltip title="Remove allocation">
              <IconButton size="small" onClick={onRemove} sx={{ p: 0.25, width: 20, height: 20 }}>
                <CloseIcon sx={{ fontSize: 14, color: 'grey.400' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Per-Invoice Budget Adjustment Modal */}
      <Dialog
        open={coModalOpen}
        onClose={() => setCOModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
          Request Budget Adjustment
        </DialogTitle>
        <Box sx={{ px: 3, pb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            For invoice <strong>{allocation.invoiceNumber}</strong> ({allocation.vendorName})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Budget line: {lineItemDescription}
          </Typography>
        </Box>
        <DialogContent>
          {/* Summary box */}
          <Box
            sx={{
              bgcolor: 'grey.50',
              borderRadius: 1,
              p: 1.5,
              mb: 2,
              border: '1px solid',
              borderColor: 'grey.200',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">This invoice allocation</Typography>
              <Typography variant="body2"  fontWeight={600}>{fmtFull(allocation.amount)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Line available before</Typography>
              <Typography variant="body2" >{fmtFull(lineItemBudgeted - lineItemPriorDraws)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Total line item overage</Typography>
              <Typography variant="body2" color="error.main">{fmtFull(totalOverageAmount)}</Typography>
            </Box>
            {totalCOAmountForLineItem > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Already covered by other adjustments</Typography>
                <Typography variant="body2" color="info.main">−{fmtFull(totalCOAmountForLineItem)}</Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5, borderTop: '1px solid', borderColor: 'grey.300' }}>
              <Typography variant="body2" fontWeight={600} color="error.main">Remaining shortfall</Typography>
              <Typography variant="body2" fontWeight={700} color="error.main">{fmtFull(uncoveredOverage)}</Typography>
            </Box>
          </Box>

          {/* Adjustment Amount */}
          <TextField
            label="Adjustment Amount"
            fullWidth
            size="small"
            value={coAmount}
            onChange={(e) => setCOAmount(e.target.value)}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography>,
            }}
            sx={{ mb: 2 }}
          />

          {/* Reason - A15-1: Now specific to this invoice */}
          <TextField
            label="Reason for this invoice"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={coReason}
            onChange={(e) => setCOReason(e.target.value)}
            placeholder="Why does this invoice require additional budget?"
            required
            helperText="Provide a specific reason for this invoice's budget overage"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCOModalOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateCO}
            disabled={!coReason.trim() || !coAmount}
            sx={{ textTransform: 'none' }}
          >
            Request Adjustment
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// === Category Group ===
function CategoryGroup({ category }: { category: BudgetCategory }) {
  const { toggleCategory } = useAllocation();
  const catThisDraw = category.lineItems.reduce(
    (sum, li) => sum + getLineItemThisDraw(li),
    0
  );

  return (
    <>
      {/* Category Header */}
      <Box
        onClick={() => toggleCategory(category.id)}
        sx={{
          display: 'grid',
          gridTemplateColumns: GRID_COLUMNS,
          alignItems: 'center',
          px: 2,
          py: 1,
          bgcolor: 'grey.50',
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'grey.100' },
          userSelect: 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {category.expanded ? (
            <ExpandMoreIcon fontSize="small" sx={{ color: 'grey.600' }} />
          ) : (
            <ChevronRightIcon fontSize="small" sx={{ color: 'grey.600' }} />
          )}
        </Box>
        <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
          {category.number} {category.name}
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 600 }}>
          {fmt(category.lineItems.reduce((s, li) => s + li.budgeted, 0))}
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 600 }}>
          {fmt(category.lineItems.reduce((s, li) => s + getLineItemAvailable(li), 0))}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            textAlign: 'right',
            fontWeight: 600,
            color: catThisDraw > 0 ? 'primary.main' : 'text.secondary',
            pr: 0.5,
          }}
        >
          {catThisDraw > 0 ? fmt(catThisDraw) : '—'}
        </Typography>
      </Box>

      {/* Line Items (collapsible) */}
      <Collapse in={category.expanded}>
        {category.lineItems.map(li => (
          <LineItemRow key={li.id} lineItem={li} />
        ))}
      </Collapse>
    </>
  );
}

// === Main Budget Table ===
export default function BudgetTable() {
  const { categories, invoices, totalThisDraw, totalBudgeted, totalAvailable } = useAllocation();

  const invoiceCount = invoices.length;

  return (
    <Box
      sx={{
        flex: '1 1 60%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid',
        borderColor: 'grey.200',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Budget Allocation
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700 }}>
          {fmtFull(totalThisDraw)}
        </Typography>
      </Box>

      {/* Column Headers */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: GRID_COLUMNS,
          alignItems: 'center',
          px: 2,
          py: 0.75,
          bgcolor: 'grey.100',
          borderBottom: '2px solid',
          borderColor: 'grey.300',
          flexShrink: 0,
        }}
      >
        <Typography variant="caption" fontWeight={700} color="text.secondary">#</Typography>
        <Typography variant="caption" fontWeight={700} color="text.secondary">Description</Typography>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textAlign: 'right' }}>Budgeted</Typography>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textAlign: 'right' }}>Available</Typography>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textAlign: 'right', pr: 0.5 }}>This Request</Typography>
      </Box>

      {/* Scrollable Body */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {categories.map(cat => (
          <CategoryGroup key={cat.id} category={cat} />
        ))}
      </Box>

      {/* Sticky Total Footer */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: GRID_COLUMNS,
          alignItems: 'center',
          px: 2,
          py: 1,
          borderTop: '2px solid',
          borderColor: 'grey.400',
          bgcolor: 'grey.50',
          flexShrink: 0,
        }}
      >
        <Box />
        <Typography variant="subtitle2">TOTAL</Typography>
        <Typography variant="subtitle2" sx={{ textAlign: 'right' }}>
          {fmt(totalBudgeted)}
        </Typography>
        <Typography variant="subtitle2" sx={{ textAlign: 'right' }}>
          {fmt(totalAvailable)}
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'right', color: 'primary.main', pr: 0.5 }}
        >
          {fmtFull(totalThisDraw)}
        </Typography>
      </Box>
    </Box>
  );
}
