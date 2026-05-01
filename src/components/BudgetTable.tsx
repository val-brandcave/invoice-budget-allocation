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
function LineItemRow({ lineItem, categoryNumber, categoryName }: { lineItem: BudgetLineItem; categoryNumber: string; categoryName: string }) {
  const { invoices, removeAllocation, updateAllocationAmount, updateAllocationMode, getChangeOrderForAllocation, createChangeOrder, removeChangeOrder, updateChangeOrder, sessionCONumber, getTotalCOAmountForLineItem } = useAllocation();
  const thisDraw = getLineItemThisDraw(lineItem);
  const available = getLineItemAvailable(lineItem);
  const isOverBudget = available < 0;

  // Calculate total overage and total CO amount for this line item
  const totalOverage = available < 0 ? Math.abs(available) : 0;
  const totalCOAmount = getTotalCOAmountForLineItem(lineItem.id);

  // Provisional budget: original + pending CO amounts
  const provisionalBudgeted = lineItem.budgeted + totalCOAmount;
  const hasProvisionalBudget = totalCOAmount > 0;
  // Provisional available: recalculate against provisional budget
  const provisionalAvailable = provisionalBudgeted - lineItem.priorDraws - thisDraw;

  // Overage is covered if total COs >= total overage
  const allOveragesCovered = !isOverBudget || totalCOAmount >= totalOverage;

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
          borderColor: isOver ? 'info.main' : 'grey.200',
          bgcolor: isOver ? 'info.lighter' : showErrorState ? 'error.lighter' : 'background.paper',
          borderLeft: isOver ? '3px solid' : showErrorState ? '3px solid' : '3px solid transparent',
          borderLeftColor: isOver ? 'info.main' : showErrorState ? 'error.main' : 'transparent',
          transition: 'all 0.15s ease',
          '&:hover': {
            bgcolor: showErrorState ? 'error.lighter' : 'grey.50',
          },
        }}
      >
        <Typography variant="body2" color="text.secondary">{lineItem.number}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
          <Typography variant="body2">{lineItem.description}</Typography>
        </Box>
        <Tooltip
          title={hasProvisionalBudget ? `Original: ${fmt(lineItem.budgeted)} + ${fmt(totalCOAmount)} adjustment` : ''}
          arrow
          disableHoverListener={!hasProvisionalBudget}
        >
          <Typography
            variant="body2"
            sx={{
              textAlign: 'right',
              color: hasProvisionalBudget ? 'info.main' : 'text.primary',
              fontWeight: hasProvisionalBudget ? 600 : 400,
            }}
          >
            {fmt(hasProvisionalBudget ? provisionalBudgeted : lineItem.budgeted)}
          </Typography>
        </Tooltip>
        <Typography
          variant="body2"
          sx={{
            textAlign: 'right',
            color: showErrorState ? 'error.main' : allOveragesCovered && isOverBudget ? 'info.main' : 'text.primary',
            fontWeight: showErrorState ? 700 : allOveragesCovered && isOverBudget ? 600 : 400,
            fontStyle: 'normal',
          }}
        >
          {fmt(hasProvisionalBudget ? provisionalAvailable : available)}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            textAlign: 'right',
            fontWeight: thisDraw > 0 ? 700 : 400,
            color: thisDraw > 0 ? 'info.main' : 'text.secondary',
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
            lineItemNumber={lineItem.number}
            lineItemDescription={lineItem.description}
            categoryNumber={categoryNumber}
            categoryName={categoryName}
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
            onUpdateCO={updateChangeOrder}
            sessionCONumber={sessionCONumber}
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
  lineItemNumber,
  lineItemDescription,
  categoryNumber,
  categoryName,
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
  onUpdateCO,
  sessionCONumber,
  totalCOAmountForLineItem,
}: {
  allocation: Allocation;
  lineItemId: string;
  lineItemNumber: string;
  lineItemDescription: string;
  categoryNumber: string;
  categoryName: string;
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
  onUpdateCO: (coId: string, amount: number, reason: string) => void;
  sessionCONumber: string;
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
  const [isEditMode, setIsEditMode] = useState(false);

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
    setIsEditMode(false);
    setCOModalOpen(true);
  };

  const handleEditCO = () => {
    if (pendingCO) {
      setCOAmount(pendingCO.amount.toFixed(2));
      setCOReason(pendingCO.reason);
      setIsEditMode(true);
      setCOModalOpen(true);
    }
  };

  const handleSaveCO = () => {
    const amount = parseFloat(coAmount);
    if (!isNaN(amount) && amount > 0 && coReason.trim()) {
      if (isEditMode && pendingCO) {
        onUpdateCO(pendingCO.id, amount, coReason.trim());
      } else {
        onCreateCO(
          lineItemId,
          allocation.invoiceId,
          allocation.vendorName,
          allocation.invoiceNumber,
          amount,
          coReason.trim()
        );
      }
      setCOModalOpen(false);
      setIsEditMode(false);
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
          bgcolor: needsCO ? 'warning.lighter' : 'info.lighter',
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
          <Typography variant="caption" sx={{ color: needsCO ? 'warning.dark' : 'info.main' }}>↳</Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }} noWrap>
            {allocation.vendorName}
          </Typography>
          <Chip
            label={allocation.invoiceNumber}
            size="small"
            sx={{ height: 20, fontSize: '0.7rem', bgcolor: needsCO ? 'warning.lighter' : 'info.lighter', color: needsCO ? 'warning.dark' : 'info.dark', flexShrink: 0 }}
          />

          {/* Show adjustment chip with amount (static display) + separate Edit action */}
          {hasCO && pendingCO && (
            <>
              <Chip
                label={`+${fmtFull(pendingCO.amount)} Requested`}
                size="small"
                onDelete={() => onRemoveCO(pendingCO.id)}
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
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
              <Link
                component="button"
                variant="caption"
                onClick={handleEditCO}
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'info.dark',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  flexShrink: 0,
                  '&:hover': { color: 'info.main' },
                }}
              >
                Edit
              </Link>
            </>
          )}

          {/* Over Budget status indicator (non-clickable) + action link */}
          {needsCO && (
            <>
              <Chip
                icon={<ErrorOutlineIcon sx={{ fontSize: '14px !important' }} />}
                label="Over Budget"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  bgcolor: 'warning.main',
                  color: 'warning.contrastText',
                  flexShrink: 0,
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
                  borderColor: 'info.main',
                  borderRadius: 0,
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
                      color: 'info.main',
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
                  borderRadius: 0,
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
                    color: needsCO ? 'warning.dark' : 'info.main',
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
        onClose={() => { setCOModalOpen(false); setIsEditMode(false); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 0 } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          {isEditMode ? 'Edit Budget Adjustment' : 'Request Budget Adjustment'}
          <Typography
            component="span"
            variant="body2"
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 0,
              bgcolor: 'grey.100',
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          >
            {sessionCONumber}
          </Typography>
        </DialogTitle>
        <Box sx={{ px: 3, pb: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
              Invoice
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {allocation.invoiceNumber}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {allocation.vendorName}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
              Budget Category
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {categoryNumber}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {categoryName}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
              Budget Line Item
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {lineItemNumber}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {lineItemDescription}
            </Typography>
          </Box>
        </Box>
        <DialogContent>
          {/* Summary box */}
          <Box
            sx={{
              bgcolor: 'grey.50',
              borderRadius: 0,
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
          <Button onClick={() => { setCOModalOpen(false); setIsEditMode(false); }} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveCO}
            disabled={!coReason.trim() || !coAmount}
            sx={{ textTransform: 'none' }}
          >
            {isEditMode ? 'Save Changes' : 'Request Adjustment'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// === Category Group ===
function CategoryGroup({ category }: { category: BudgetCategory }) {
  const { toggleCategory, getTotalCOAmountForLineItem } = useAllocation();
  const catThisDraw = category.lineItems.reduce(
    (sum, li) => sum + getLineItemThisDraw(li),
    0
  );
  // Provisional category sums
  const catTotalCO = category.lineItems.reduce(
    (sum, li) => sum + getTotalCOAmountForLineItem(li.id),
    0
  );
  const catHasProvisional = catTotalCO > 0;

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
        <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 600, color: catHasProvisional ? 'info.main' : 'text.primary' }}>
          {fmt(category.lineItems.reduce((s, li) => s + li.budgeted, 0) + catTotalCO)}
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 600, color: catHasProvisional ? 'info.main' : 'text.primary' }}>
          {fmt(category.lineItems.reduce((s, li) => s + li.budgeted + getTotalCOAmountForLineItem(li.id) - li.priorDraws - getLineItemThisDraw(li), 0))}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            textAlign: 'right',
            fontWeight: 600,
            color: catThisDraw > 0 ? 'info.main' : 'text.secondary',
            pr: 0.5,
          }}
        >
          {catThisDraw > 0 ? fmt(catThisDraw) : '—'}
        </Typography>
      </Box>

      {/* Line Items (collapsible) */}
      <Collapse in={category.expanded}>
        {category.lineItems.map(li => (
          <LineItemRow key={li.id} lineItem={li} categoryNumber={category.number} categoryName={category.name} />
        ))}
      </Collapse>
    </>
  );
}

// === Fee configuration for this project (read-only display) ===
const PROJECT_FEES = [
  { id: 'fee-contractor', description: "Contractor's Fee", type: 'percentage' as const, rate: 10, displayType: '10%' },
  { id: 'fee-lw', description: 'LedgerWise Trust Account Fee', type: 'percentage' as const, rate: 1.5, displayType: '1.5%' },
];

// === Expandable Fee Summary Footer ===
function FeeSummaryFooter({ subtotal }: { subtotal: number }) {
  const [expanded, setExpanded] = useState(false);

  const fees = PROJECT_FEES.map(fee => ({
    ...fee,
    amount: Math.round(subtotal * (fee.rate / 100) * 100) / 100,
  }));
  const totalFees = fees.reduce((s, f) => s + f.amount, 0);
  const grandTotal = subtotal + totalFees;

  return (
    <Box sx={{ flexShrink: 0 }}>
      {/* Clickable trigger row */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          bgcolor: 'grey.100',
          borderTop: '2px solid',
          borderColor: 'grey.400',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'grey.200' },
          userSelect: 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {expanded ? (
            <ExpandMoreIcon fontSize="small" sx={{ color: 'grey.600' }} />
          ) : (
            <ChevronRightIcon fontSize="small" sx={{ color: 'grey.600' }} />
          )}
          <Typography variant="subtitle2" fontWeight={700}>
            Total Construction Cost
          </Typography>
          {!expanded && fees.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              (incl. {fees.length} fee{fees.length !== 1 ? 's' : ''})
            </Typography>
          )}
        </Box>
        <Typography variant="subtitle2" fontWeight={700}>
          {fmt(grandTotal)}
        </Typography>
      </Box>

      {/* Expanded detail */}
      <Collapse in={expanded} unmountOnExit>
        <Box sx={{ px: 3, py: 2, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'grey.200' }}>
          {/* Subtotal */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">Subtotal (Cost of Work)</Typography>
            <Typography variant="body2">{fmt(subtotal)}</Typography>
          </Box>

          {/* Dashed divider */}
          <Box sx={{ borderTop: '1px dashed', borderColor: 'grey.300', mb: 1.5 }} />

          {/* Fees header */}
          <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem', mb: 1, display: 'block' }}>
            FEES
          </Typography>

          {/* Fee lines */}
          {fees.map(fee => (
            <Box key={fee.id} sx={{ display: 'flex', justifyContent: 'space-between', pl: 2, mb: 0.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">{fee.description}</Typography>
                <Typography variant="caption" color="text.secondary">({fee.displayType})</Typography>
              </Box>
              <Typography variant="body2">{fmt(fee.amount)}</Typography>
            </Box>
          ))}

          {/* Fees total */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, mt: 0.5, borderTop: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="body2" fontWeight={600}>Fees Total</Typography>
            <Typography variant="body2" fontWeight={600}>{fmt(totalFees)}</Typography>
          </Box>

          {/* Grand total */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, mt: 1, borderTop: '2px solid', borderColor: 'grey.400' }}>
            <Typography variant="subtitle2" fontWeight={700}>Grand Total</Typography>
            <Typography variant="subtitle2" fontWeight={700}>{fmt(grandTotal)}</Typography>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

// === Main Budget Table ===
export default function BudgetTable() {
  const { categories, totalThisDraw, totalBudgeted, totalAvailable, pendingChangeOrders } = useAllocation();

  // Check if any provisional budgets exist
  const hasAnyProvisional = pendingChangeOrders.length > 0;

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
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
        <Typography variant="subtitle1" sx={{ color: 'info.main', fontWeight: 700 }}>
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
        <Typography variant="subtitle2">SUBTOTAL</Typography>
        <Typography variant="subtitle2" sx={{ textAlign: 'right', color: hasAnyProvisional ? 'info.main' : 'text.primary' }}>
          {fmt(totalBudgeted)}
        </Typography>
        <Typography variant="subtitle2" sx={{ textAlign: 'right', color: hasAnyProvisional ? 'info.main' : 'text.primary' }}>
          {fmt(totalAvailable)}
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'right', color: 'info.main', pr: 0.5 }}
        >
          {fmtFull(totalThisDraw)}
        </Typography>
      </Box>

      {/* Expandable Fee Summary Footer */}
      <FeeSummaryFooter subtotal={totalBudgeted} />
    </Box>
  );
}
