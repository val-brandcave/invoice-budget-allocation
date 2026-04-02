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
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useDroppable } from '@dnd-kit/core';
import { useAllocation } from '../AllocationContext';
import type { BudgetCategory, BudgetLineItem, Allocation } from '../types';
import { getLineItemThisDraw, getLineItemAvailable } from '../types';

// === Format helpers ===
function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtFull(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

// === Droppable Line Item Row ===
function LineItemRow({ lineItem, catNumber }: { lineItem: BudgetLineItem; catNumber: string }) {
  const { removeAllocation, updateAllocationAmount } = useAllocation();
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
          gridTemplateColumns: '60px 1fr 100px 100px 100px',
          alignItems: 'center',
          px: 1.5,
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
          }}
        >
          {thisDraw > 0 ? fmt(thisDraw) : '—'}
        </Typography>
      </Box>

      {/* Allocation sub-rows */}
      {lineItem.allocations.map(alloc => (
        <AllocationRow
          key={alloc.id}
          allocation={alloc}
          lineItemId={lineItem.id}
          onRemove={() => removeAllocation(lineItem.id, alloc.id)}
          onUpdateAmount={(amt) => updateAllocationAmount(lineItem.id, alloc.id, amt)}
        />
      ))}
    </>
  );
}

// === Allocation Sub-Row ===
function AllocationRow({
  allocation,
  lineItemId,
  onRemove,
  onUpdateAmount,
}: {
  allocation: Allocation;
  lineItemId: string;
  onRemove: () => void;
  onUpdateAmount: (amount: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(allocation.amount.toString());

  const handleSave = () => {
    const parsed = parseFloat(editValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateAmount(parsed);
    }
    setEditing(false);
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '60px 1fr 100px 100px 100px',
        alignItems: 'center',
        px: 1.5,
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2 }}>
        <Typography variant="caption" sx={{ color: 'primary.main' }}>↳</Typography>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {allocation.vendorName}
        </Typography>
        <Chip
          label={allocation.invoiceNumber}
          size="small"
          sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'primary.lighter', color: 'primary.dark' }}
        />
        {allocation.description !== 'Full Invoice' && (
          <Typography variant="caption" color="text.secondary" noWrap>
            · {allocation.description}
          </Typography>
        )}
      </Box>
      <Box />
      <Box />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
        {editing ? (
          <TextField
            size="small"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            sx={{ width: 100, '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.5 } }}
          />
        ) : (
          <Typography
            variant="body2"
            onClick={() => {
              setEditValue(allocation.amount.toString());
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
            {fmtFull(allocation.amount)}
          </Typography>
        )}
        <Tooltip title="Remove allocation">
          <IconButton size="small" onClick={onRemove} sx={{ p: 0.25 }}>
            <CloseIcon sx={{ fontSize: 14, color: 'grey.400' }} />
          </IconButton>
        </Tooltip>
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
          gridTemplateColumns: '60px 1fr 100px 100px 100px',
          alignItems: 'center',
          px: 1.5,
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
          }}
        >
          {catThisDraw > 0 ? fmt(catThisDraw) : '—'}
        </Typography>
      </Box>

      {/* Line Items (collapsible) */}
      <Collapse in={category.expanded}>
        {category.lineItems.map(li => (
          <LineItemRow key={li.id} lineItem={li} catNumber={category.number} />
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
        flex: '1 1 62%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid',
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
          gridTemplateColumns: '60px 1fr 100px 100px 100px',
          alignItems: 'center',
          px: 1.5,
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
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textAlign: 'right' }}>This Draw</Typography>
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
          gridTemplateColumns: '60px 1fr 100px 100px 100px',
          alignItems: 'center',
          px: 1.5,
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
          sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'primary.main' }}
        >
          {fmtFull(totalThisDraw)}
        </Typography>
      </Box>
    </Box>
  );
}
