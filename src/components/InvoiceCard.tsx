import { useState } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Collapse,
  Chip,
  Button,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useDraggable } from '@dnd-kit/core';
import type { Invoice, InvoiceSubItem, BudgetCategory } from '../types';
import {
  getInvoiceAllocatedAmount,
  getInvoiceProgress,
  getInvoiceStatus,
  getSubItemAllocatedAmount,
  getSubItemAllocations,
} from '../types';
import AllocatePopover from './AllocatePopover';

// === Format ===
function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtFull(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

// === Sub-Item (draggable on desktop, static on mobile) ===
function SubItem({
  subItem,
  invoice,
  categories,
  isMobile,
}: {
  subItem: InvoiceSubItem;
  invoice: Invoice;
  categories: BudgetCategory[];
  isMobile: boolean;
}) {
  const allocated = getSubItemAllocatedAmount(subItem.id, categories);
  const remaining = subItem.amount - allocated;
  const allocations = getSubItemAllocations(subItem.id, categories);
  const isFullyAllocated = remaining < 0.01;
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

  // Only use draggable on desktop
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `drag-sub-${subItem.id}`,
    data: {
      type: 'sub-item',
      invoiceId: invoice.id,
      subItemId: subItem.id,
      vendorName: invoice.vendorName,
      invoiceNumber: invoice.invoiceNumber,
      description: subItem.description,
      amount: subItem.amount,
      remainingAmount: remaining,
    },
    disabled: isFullyAllocated || isMobile,
  });

  const style = (!isMobile && transform)
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const dragProps = isMobile ? {} : { ...attributes, ...listeners };

  return (
    <Box
      ref={isMobile ? undefined : setNodeRef}
      style={style}
      {...dragProps}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: isMobile ? 1.25 : 0.75,
        borderRadius: 1,
        bgcolor: isFullyAllocated ? 'success.lighter' : 'grey.50',
        border: '1px solid',
        borderColor: isFullyAllocated ? 'success.light' : 'grey.200',
        opacity: isDragging ? 0.5 : isFullyAllocated ? 0.7 : 1,
        cursor: isMobile ? 'default' : isFullyAllocated ? 'default' : 'grab',
        '&:hover': (isMobile || isFullyAllocated)
          ? {}
          : { borderColor: 'primary.main', bgcolor: 'primary.lighter' },
        transition: 'all 0.15s',
      }}
    >
      {!isMobile && !isFullyAllocated && (
        <DragIndicatorIcon sx={{ fontSize: 14, color: 'grey.400', flexShrink: 0 }} />
      )}
      {isFullyAllocated && (
        <CheckCircleIcon sx={{ fontSize: isMobile ? 18 : 14, color: 'success.main', flexShrink: 0 }} />
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" fontWeight={600} noWrap sx={{ fontSize: isMobile ? '0.8rem' : undefined }}>
            {subItem.description}
          </Typography>
          <Typography variant="caption" fontWeight={700} sx={{ fontFamily: 'monospace', flexShrink: 0, ml: 1 }}>
            {fmt(subItem.amount)}
          </Typography>
        </Box>

        {/* Show where it's allocated */}
        {allocations.length > 0 && (
          <Box sx={{ mt: 0.25 }}>
            {allocations.map((a, i) => (
              <Typography key={i} variant="caption" color="primary.main" sx={{ display: 'block', fontSize: '0.675rem' }}>
                → {a.lineItemNumber} {a.lineItemDesc} {fmtFull(a.amount)}
              </Typography>
            ))}
          </Box>
        )}

        {/* AI Suggestion Badge */}
        {!isFullyAllocated && allocations.length === 0 && subItem.suggestedLineItemId && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
            <SmartToyIcon sx={{ fontSize: 11, color: 'info.main' }} />
            <Typography variant="caption" color="info.main" sx={{ fontSize: '0.675rem' }}>
              AI suggests matching budget line
            </Typography>
          </Box>
        )}

        {/* Click-to-allocate button */}
        {!isFullyAllocated && (
          <Button
            size="small"
            startIcon={<AddCircleOutlineIcon sx={{ fontSize: '14px !important' }} />}
            onClick={(e) => { e.stopPropagation(); setPopoverAnchor(e.currentTarget); }}
            sx={{
              mt: 0.5,
              textTransform: 'none',
              fontSize: isMobile ? '0.8rem' : '0.7rem',
              py: isMobile ? 0.5 : 0,
              minHeight: isMobile ? 36 : 24,
              color: 'primary.main',
            }}
          >
            Allocate
          </Button>
        )}
      </Box>
      <AllocatePopover
        anchorEl={popoverAnchor}
        open={Boolean(popoverAnchor)}
        onClose={() => setPopoverAnchor(null)}
        invoiceId={invoice.id}
        subItemId={subItem.id}
        vendorName={invoice.vendorName}
        invoiceNumber={invoice.invoiceNumber}
        description={subItem.description}
        amount={remaining}
      />
    </Box>
  );
}

// === Main Invoice Card ===
export default function InvoiceCard({
  invoice,
  categories,
  isActive,
  onSelect,
  isMobile = false,
}: {
  invoice: Invoice;
  categories: BudgetCategory[];
  isActive: boolean;
  onSelect: () => void;
  isMobile?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const status = getInvoiceStatus(invoice, categories);
  const progress = getInvoiceProgress(invoice, categories);
  const allocated = getInvoiceAllocatedAmount(invoice, categories);
  const remaining = invoice.amount - allocated;
  const hasSubItems = invoice.subItems.length > 1;
  const isFullyAllocated = status === 'fully_allocated';

  // Whole invoice draggable (desktop only)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `drag-inv-${invoice.id}`,
    data: {
      type: 'invoice',
      invoiceId: invoice.id,
      vendorName: invoice.vendorName,
      invoiceNumber: invoice.invoiceNumber,
      description: 'Full Invoice',
      amount: invoice.amount,
      remainingAmount: remaining,
    },
    disabled: isFullyAllocated || isMobile,
  });

  const style = (!isMobile && transform)
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 1000 }
    : undefined;

  const dragProps = isMobile ? {} : { ...attributes, ...listeners };

  if (isFullyAllocated) {
    return (
      <Box
        onClick={onSelect}
        sx={{
          p: isMobile ? 2 : 1.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'success.light',
          bgcolor: 'success.lighter',
          opacity: 0.75,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <CheckCircleIcon sx={{ fontSize: isMobile ? 22 : 18, color: 'success.main' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            {invoice.vendorName} · {invoice.invoiceNumber}
          </Typography>
          <Typography variant="caption" color="success.main">
            {fmtFull(invoice.amount)} · Fully allocated
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      ref={isMobile ? undefined : setNodeRef}
      style={style}
      onClick={onSelect}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: isActive ? 'primary.main' : isDragging ? 'primary.light' : 'grey.200',
        bgcolor: isDragging ? 'primary.lighter' : 'background.paper',
        opacity: isDragging ? 0.8 : 1,
        overflow: 'hidden',
        boxShadow: isActive ? '0 0 0 2px rgba(25, 57, 183, 0.15)' : isDragging ? 2 : 0,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        '&:hover': { borderColor: 'primary.light' },
      }}
    >
      {/* Main card header */}
      <Box
        {...dragProps}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          p: isMobile ? 2 : 1.5,
          cursor: isMobile ? 'default' : 'grab',
          '&:active': isMobile ? {} : { cursor: 'grabbing' },
        }}
      >
        {!isMobile && (
          <DragIndicatorIcon sx={{ fontSize: 18, color: 'grey.400', mt: 0.25, flexShrink: 0 }} />
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant={isMobile ? 'body1' : 'subtitle2'} fontWeight={600} noWrap>
              {invoice.vendorName}
            </Typography>
            <Typography variant={isMobile ? 'body1' : 'subtitle2'} fontWeight={600} sx={{ fontFamily: 'monospace', flexShrink: 0, ml: 1 }}>
              {fmtFull(invoice.amount)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
            <Typography variant="caption" color="text.secondary">
              {invoice.invoiceNumber}
            </Typography>
            <Typography variant="caption" color="text.secondary">·</Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(invoice.receivedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }} noWrap>
            {invoice.aiSummary}
          </Typography>

          {/* Progress bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                flex: 1,
                height: isMobile ? 8 : 6,
                borderRadius: 3,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  bgcolor: progress === 100 ? 'success.main' : 'primary.main',
                },
              }}
            />
            <Typography variant="caption" fontWeight={600} sx={{ minWidth: 32, textAlign: 'right' }}>
              {progress}%
            </Typography>
          </Box>

          {/* Allocated / Remaining breakdown */}
          {allocated > 0 && remaining > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                {fmtFull(allocated)} allocated
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                ·
              </Typography>
              <Typography variant="caption" color="warning.main" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                {fmtFull(remaining)} remaining
              </Typography>
            </Box>
          )}

          {/* Click-to-allocate */}
          {!hasSubItems && remaining > 0 && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddCircleOutlineIcon sx={{ fontSize: '14px !important' }} />}
              onClick={(e) => { e.stopPropagation(); setPopoverAnchor(e.currentTarget); }}
              sx={{
                mt: 1,
                textTransform: 'none',
                fontSize: isMobile ? '0.85rem' : '0.75rem',
                py: isMobile ? 0.75 : 0.25,
                minHeight: isMobile ? 44 : undefined,
                borderRadius: 1,
              }}
            >
              Allocate to budget line
            </Button>
          )}
        </Box>
      </Box>

      {/* Expandable sub-items section */}
      {hasSubItems && (
        <>
          <Box
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: isMobile ? 2 : 1.5,
              py: isMobile ? 1 : 0.5,
              minHeight: isMobile ? 44 : undefined,
              borderTop: '1px solid',
              borderColor: 'grey.100',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'grey.50' },
            }}
          >
            {expanded ? (
              <ExpandMoreIcon sx={{ fontSize: 16, color: 'grey.500' }} />
            ) : (
              <ChevronRightIcon sx={{ fontSize: 16, color: 'grey.500' }} />
            )}
            <Typography variant="caption" color="text.secondary">
              {invoice.subItems.length} line items
            </Typography>
            {invoice.subItems.some(si => si.suggestedLineItemId) && !expanded && (
              <Chip
                icon={<SmartToyIcon sx={{ fontSize: '12px !important' }} />}
                label="AI parsed"
                size="small"
                sx={{ height: 18, fontSize: '0.65rem', ml: 'auto', bgcolor: 'info.lighter', color: 'info.main' }}
              />
            )}
          </Box>
          <Collapse in={expanded}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, px: isMobile ? 2 : 1.5, pb: 1.5 }}>
              {invoice.subItems.map(si => (
                <SubItem key={si.id} subItem={si} invoice={invoice} categories={categories} isMobile={isMobile} />
              ))}
            </Box>
          </Collapse>
        </>
      )}

      {/* Whole-invoice allocate popover */}
      <AllocatePopover
        anchorEl={popoverAnchor}
        open={Boolean(popoverAnchor)}
        onClose={() => setPopoverAnchor(null)}
        invoiceId={invoice.id}
        vendorName={invoice.vendorName}
        invoiceNumber={invoice.invoiceNumber}
        description="Full Invoice"
        amount={remaining}
      />
    </Box>
  );
}
