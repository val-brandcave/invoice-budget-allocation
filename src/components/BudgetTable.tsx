import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Collapse,
  TextField,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import { useDroppable } from '@dnd-kit/core';
import { useAllocation } from '../AllocationContext';
import type { BudgetCategory, BudgetLineItem, Allocation } from '../types';
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
function LineItemRow({ lineItem }: { lineItem: BudgetLineItem }) {
  const { invoices, removeAllocation, updateAllocationAmount, updateAllocationMode } = useAllocation();
  const thisDraw = getLineItemThisDraw(lineItem);
  const available = getLineItemAvailable(lineItem);

  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${lineItem.id}`,
    data: { lineItemId: lineItem.id },
  });

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
          bgcolor: isOver ? 'primary.lighter' : 'background.paper',
          borderLeft: isOver ? '3px solid' : '3px solid transparent',
          borderLeftColor: isOver ? 'primary.main' : 'transparent',
          transition: 'all 0.15s ease',
          '&:hover': {
            bgcolor: 'grey.50',
          },
        }}
      >
        <Typography variant="body2" color="text.secondary">{lineItem.number}</Typography>
        <Typography variant="body2" sx={{ pr: 1 }}>{lineItem.description}</Typography>
        <Typography variant="body2" sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(lineItem.budgeted)}</Typography>
        <Typography
          variant="body2"
          sx={{
            textAlign: 'right',
            fontFamily: 'monospace',
            color: available < 0 ? 'error.main' : 'text.primary',
          }}
        >
          {fmt(available)}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            textAlign: 'right',
            fontFamily: 'monospace',
            fontWeight: thisDraw > 0 ? 700 : 400,
            color: thisDraw > 0 ? 'primary.main' : 'text.secondary',
            pr: 0.5,
          }}
        >
          {thisDraw > 0 ? fmt(thisDraw) : '—'}
        </Typography>
      </Box>

      {/* Allocation sub-rows */}
      {lineItem.allocations.map(alloc => {
        const inv = invoices.find(i => i.id === alloc.invoiceId);
        const invoiceAmount = inv?.amount ?? 0;
        return (
          <AllocationRow
            key={alloc.id}
            allocation={alloc}
            invoiceAmount={invoiceAmount}
            onRemove={() => removeAllocation(lineItem.id, alloc.id)}
            onUpdateAmount={(amt) => updateAllocationAmount(lineItem.id, alloc.id, amt)}
            onUpdateMode={(mode, pct) => updateAllocationMode(lineItem.id, alloc.id, mode, invoiceAmount, pct)}
          />
        );
      })}
    </>
  );
}

// === Allocation Sub-Row ===
function AllocationRow({
  allocation,
  invoiceAmount,
  onRemove,
  onUpdateAmount,
  onUpdateMode,
}: {
  allocation: Allocation;
  invoiceAmount: number;
  onRemove: () => void;
  onUpdateAmount: (amount: number) => void;
  onUpdateMode: (mode: 'fixed' | 'percentage', percentage?: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(allocation.amount.toString());
  const isPercentage = allocation.mode === 'percentage';

  const handleSave = () => {
    const cleaned = editValue.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed > 0) {
      if (isPercentage) {
        onUpdateMode('percentage', parsed);
      } else {
        onUpdateAmount(parsed);
      }
    }
    setEditing(false);
  };

  const handleToggleMode = () => {
    if (isPercentage) {
      onUpdateMode('fixed');
    } else {
      // Percentage is relative to the invoice total amount
      const pct = invoiceAmount > 0 ? (allocation.amount / invoiceAmount) * 100 : 0;
      onUpdateMode('percentage', Math.round(pct * 100) / 100);
    }
  };

  return (
    <Box
      sx={{
        display: 'grid',
        // Allocation row: # col, vendor info col, then value+actions spanning the last 3 columns
        gridTemplateColumns: '52px 1fr',
        alignItems: 'center',
        px: 2,
        py: 0.5,
        bgcolor: 'primary.lighter',
        borderBottom: '1px solid',
        borderColor: 'grey.100',
        animation: 'slideIn 0.2s ease-out',
        '@keyframes slideIn': {
          from: { opacity: 0, transform: 'translateY(-8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <Box />
      {/* Full-width content row: vendor info on left, value+actions on right */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2 }}>
        <Typography variant="caption" sx={{ color: 'primary.main' }}>↳</Typography>
        <Typography variant="caption" sx={{ fontWeight: 600 }} noWrap>
          {allocation.vendorName}
        </Typography>
        <Chip
          label={allocation.invoiceNumber}
          size="small"
          sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'primary.lighter', color: 'primary.dark', flexShrink: 0 }}
        />

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Value + actions — right-aligned */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
          {editing ? (
            <TextField
              size="small"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {isPercentage ? '%' : '$'}
                  </InputAdornment>
                ),
              }}
              sx={{ width: 110, '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.5 } }}
            />
          ) : (
            <Typography
              variant="body2"
              onClick={() => {
                setEditValue(
                  isPercentage
                    ? (allocation.percentage ?? 0).toString()
                    : allocation.amount.toString()
                );
                setEditing(true);
              }}
              sx={{
                fontFamily: 'monospace',
                fontWeight: 600,
                color: 'primary.main',
                cursor: 'pointer',
                textAlign: 'right',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {isPercentage
                ? `${allocation.percentage ?? 0}%`
                : fmtFull(allocation.amount)}
            </Typography>
          )}

          {/* $/% toggle — ghost text button */}
          <Tooltip title={isPercentage ? 'Switch to dollar amount' : 'Switch to percentage'}>
            <IconButton
              size="small"
              onClick={handleToggleMode}
              sx={{
                p: 0.25,
                width: 20,
                height: 20,
                borderRadius: 0.5,
                fontSize: '0.7rem',
                fontWeight: 700,
                fontFamily: 'monospace',
                color: 'grey.400',
                '&:hover': { color: 'primary.main', bgcolor: 'grey.100' },
              }}
            >
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace', lineHeight: 1 }}>
                {isPercentage ? '$' : '%'}
              </Typography>
            </IconButton>
          </Tooltip>

          {/* Remove */}
          <Tooltip title="Remove allocation">
            <IconButton size="small" onClick={onRemove} sx={{ p: 0.25, width: 20, height: 20 }}>
              <CloseIcon sx={{ fontSize: 14, color: 'grey.400' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
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
        <Typography variant="body2" sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
          {fmt(category.lineItems.reduce((s, li) => s + li.budgeted, 0))}
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
          {fmt(category.lineItems.reduce((s, li) => s + getLineItemAvailable(li), 0))}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            textAlign: 'right',
            fontFamily: 'monospace',
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
        height: '100vh',
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">PR-003</Typography>
          <Chip
            label={`${invoiceCount} Invoices`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">This Draw</Typography>
            <Typography variant="subtitle1" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
              {fmtFull(totalThisDraw)}
            </Typography>
          </Box>
        </Box>
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
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textAlign: 'right', pr: 0.5 }}>This Draw</Typography>
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
        <Typography variant="subtitle2" sx={{ textAlign: 'right', fontFamily: 'monospace' }}>
          {fmt(totalBudgeted)}
        </Typography>
        <Typography variant="subtitle2" sx={{ textAlign: 'right', fontFamily: 'monospace' }}>
          {fmt(totalAvailable)}
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'primary.main', pr: 0.5 }}
        >
          {fmtFull(totalThisDraw)}
        </Typography>
      </Box>
    </Box>
  );
}
