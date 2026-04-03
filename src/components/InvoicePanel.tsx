import { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  LinearProgress,
  SwipeableDrawer,
  Tabs,
  Tab,
  TextField,
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import { useDraggable } from '@dnd-kit/core';
import { useAllocation } from '../AllocationContext';
import {
  getInvoiceAllocatedAmount,
  getInvoiceProgress,
  getInvoiceStatus,
} from '../types';
import type { Invoice, BudgetCategory } from '../types';
import AllocatePopover from './AllocatePopover';

function fmtFull(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

// Mock PDF content — shows invoice line items
function PdfContent({
  invoice,
  isMobile,
}: {
  invoice: Invoice | null;
  isMobile: boolean;
}) {
  if (!invoice) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Select an invoice to preview
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Box sx={{ textAlign: 'center', mb: 2, pb: 1.5, borderBottom: '2px solid', borderColor: 'grey.200' }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ letterSpacing: 1, fontSize: '0.7rem' }}>
          INVOICE
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.5 }}>
          {invoice.invoiceNumber}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {invoice.vendorName}
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        {invoice.subItems.map((si, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              py: 0.75,
              px: 1,
              borderBottom: '1px dashed',
              borderColor: 'grey.200',
              '&:last-child': { borderBottom: 'none' },
            }}
          >
            <Typography variant="body2" color="text.primary">
              {si.description}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
              {fmtFull(si.amount)}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          py: 1,
          px: 1,
          borderTop: '2px solid',
          borderColor: 'grey.300',
          bgcolor: 'grey.50',
          borderRadius: 1,
        }}
      >
        <Typography variant="subtitle2">TOTAL</Typography>
        <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
          {fmtFull(invoice.amount)}
        </Typography>
      </Box>

      <Typography variant="caption" color="grey.400" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
        (Mock PDF — actual PDF rendering not in prototype scope)
      </Typography>
    </Box>
  );
}

// Editable AI summary
function EditableSummary({
  invoice,
  isMobile,
}: {
  invoice: Invoice;
  isMobile: boolean;
}) {
  const { updateInvoiceSummary } = useAllocation();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(invoice.aiSummary);

  const handleSave = () => {
    updateInvoiceSummary(invoice.id, value);
    setEditing(false);
  };

  if (editing) {
    return (
      <TextField
        size="small"
        fullWidth
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        autoFocus
        sx={{
          mt: 0.5,
          '& .MuiInputBase-input': {
            fontSize: '0.75rem',
            py: 0.5,
            px: 1,
          },
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        mt: 0.5,
        cursor: 'pointer',
        '&:hover .edit-icon': { opacity: 1 },
      }}
      onClick={() => {
        setValue(invoice.aiSummary);
        setEditing(true);
      }}
    >
      <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1 }}>
        {invoice.aiSummary}
      </Typography>
      <EditIcon
        className="edit-icon"
        sx={{ fontSize: 12, color: 'grey.400', opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}
      />
    </Box>
  );
}

// Draggable invoice card for the currently selected invoice
function DraggableInvoiceCard({
  invoice,
  categories,
  isMobile,
}: {
  invoice: Invoice;
  categories: BudgetCategory[];
  isMobile: boolean;
}) {
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const status = getInvoiceStatus(invoice, categories);
  const progress = getInvoiceProgress(invoice, categories);
  const allocated = getInvoiceAllocatedAmount(invoice, categories);
  const remaining = invoice.amount - allocated;
  const isFullyAllocated = status === 'fully_allocated';

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
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

  const dragProps = isMobile ? {} : { ...attributes, ...listeners };

  return (
    <Box
      ref={isMobile ? undefined : setNodeRef}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: isFullyAllocated ? 'success.light' : isDragging ? 'primary.light' : 'grey.200',
        bgcolor: isFullyAllocated ? 'success.lighter' : isDragging ? 'primary.lighter' : 'background.paper',
        opacity: isDragging ? 0.4 : 1,
        overflow: 'hidden',
        boxShadow: isDragging ? 2 : 0,
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <Box
        {...dragProps}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          p: isMobile ? 2 : 1.5,
          cursor: isMobile ? 'default' : isFullyAllocated ? 'default' : 'grab',
          '&:active': isMobile || isFullyAllocated ? {} : { cursor: 'grabbing' },
        }}
      >
        {!isMobile && !isFullyAllocated && (
          <DragIndicatorIcon sx={{ fontSize: 18, color: 'grey.400', mt: 0.25, flexShrink: 0 }} />
        )}
        {isFullyAllocated && (
          <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main', mt: 0.25, flexShrink: 0 }} />
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

          {/* AI Summary — editable on click */}
          <EditableSummary invoice={invoice} isMobile={isMobile} />

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
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>·</Typography>
              <Typography variant="caption" color="warning.main" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                {fmtFull(remaining)} remaining
              </Typography>
            </Box>
          )}

          {/* Allocate button */}
          {!isFullyAllocated && (
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

export default function InvoicePanel({ isMobile = false }: { isMobile?: boolean }) {
  const { invoices, categories, totalThisDraw } = useAllocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pdfDrawerOpen, setPdfDrawerOpen] = useState(false);

  const currentInvoice = invoices[currentIndex] || null;

  const fullyAllocatedCount = invoices.filter(
    inv => getInvoiceStatus(inv, categories) === 'fully_allocated'
  ).length;

  const handlePrev = () => setCurrentIndex(i => Math.max(0, i - 1));
  const handleNext = () => setCurrentIndex(i => Math.min(invoices.length - 1, i + 1));

  return (
    <Box
      sx={{
        flex: isMobile ? 1 : '1 1 40%',
        minWidth: isMobile ? 0 : 380,
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? 'auto' : '100vh',
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: 'grey.50',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: isMobile ? 2 : 1.5,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'background.paper',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant={isMobile ? 'h5' : 'h6'} fontWeight={700}>
            Invoices
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Chip
              label={`${invoices.length - fullyAllocatedCount} remaining`}
              size="small"
              sx={{
                bgcolor: (invoices.length - fullyAllocatedCount) > 0 ? 'warning.lighter' : 'success.lighter',
                fontWeight: 500,
                fontSize: '0.75rem',
              }}
            />
            <Chip
              label={`${fullyAllocatedCount} done`}
              size="small"
              sx={{ bgcolor: 'success.lighter', color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}
            />
          </Box>
        </Box>

        {isMobile && totalThisDraw > 0 && (
          <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ mt: 0.5, display: 'block' }}>
            This Draw: {fmtFull(totalThisDraw)}
          </Typography>
        )}
      </Box>

      {/* Invoice tab selector — MUI Tabs, scrollable */}
      <Box
        sx={{
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'background.paper',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <IconButton
          size="small"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          sx={{ ml: 0.5, flexShrink: 0 }}
        >
          <NavigateBeforeIcon fontSize="small" />
        </IconButton>

        <Tabs
          value={currentIndex}
          onChange={(_e, newVal) => setCurrentIndex(newVal)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            flex: 1,
            minHeight: 36,
            '& .MuiTabs-indicator': {
              height: 2,
            },
            '& .MuiTab-root': {
              minHeight: 36,
              minWidth: 0,
              px: 1.5,
              py: 0.5,
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 500,
            },
            '& .Mui-selected': {
              fontWeight: 700,
            },
            '& .MuiTabs-scrollButtons': {
              width: 28,
            },
          }}
        >
          {invoices.map((inv, idx) => {
            const status = getInvoiceStatus(inv, categories);
            const isAllocated = status === 'fully_allocated';
            return (
              <Tab
                key={inv.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {isAllocated && <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />}
                    <span>{inv.vendorName.split(' ')[0]}</span>
                  </Box>
                }
                sx={{
                  color: isAllocated ? 'success.main' : undefined,
                  opacity: isAllocated ? 0.7 : 1,
                }}
              />
            );
          })}
        </Tabs>

        <Typography variant="caption" color="text.secondary" sx={{ px: 1, flexShrink: 0, whiteSpace: 'nowrap' }}>
          {currentIndex + 1}/{invoices.length}
        </Typography>

        <IconButton
          size="small"
          onClick={handleNext}
          disabled={currentIndex === invoices.length - 1}
          sx={{ mr: 0.5, flexShrink: 0 }}
        >
          <NavigateNextIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Current invoice card — draggable */}
      <Box sx={{ px: 2, pt: 1.5, flexShrink: 0 }}>
        {currentInvoice && (
          <DraggableInvoiceCard
            invoice={currentInvoice}
            categories={categories}
            isMobile={isMobile}
          />
        )}
      </Box>

      {/* PDF viewer — always visible on desktop, drawer on mobile */}
      {isMobile ? (
        <>
          <Box sx={{ px: 2, py: 1, flexShrink: 0 }}>
            <Button
              fullWidth
              startIcon={<VisibilityIcon />}
              onClick={() => setPdfDrawerOpen(true)}
              variant="outlined"
              size="medium"
              sx={{ textTransform: 'none', fontWeight: 500, minHeight: 44 }}
            >
              Review Invoice PDF
            </Button>
          </Box>
          <SwipeableDrawer
            anchor="bottom"
            open={pdfDrawerOpen}
            onClose={() => setPdfDrawerOpen(false)}
            onOpen={() => {}}
            disableSwipeToOpen
            PaperProps={{
              sx: {
                height: '85vh',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                display: 'flex',
                flexDirection: 'column',
              },
            }}
          >
            <Box sx={{ px: 2, pt: 1, pb: 0.5, flexShrink: 0 }}>
              <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'grey.300', mx: 'auto', mb: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {currentInvoice?.invoiceNumber ?? 'Select an invoice'}
                </Typography>
                <IconButton size="small" onClick={() => setPdfDrawerOpen(false)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <IconButton size="small"><NavigateBeforeIcon fontSize="small" /></IconButton>
                <Typography variant="caption">1 / 6</Typography>
                <IconButton size="small"><NavigateNextIcon fontSize="small" /></IconButton>
                <Box sx={{ flex: 1 }} />
                <IconButton size="small"><ZoomOutIcon fontSize="small" /></IconButton>
                <IconButton size="small"><ZoomInIcon fontSize="small" /></IconButton>
              </Box>
            </Box>
            <Box
              sx={{
                flex: 1,
                m: 2,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200',
                boxShadow: 1,
                overflow: 'auto',
              }}
            >
              <PdfContent invoice={currentInvoice} isMobile />
            </Box>
          </SwipeableDrawer>
        </>
      ) : (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            m: 1.5,
            mt: 1,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.200',
            boxShadow: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* PDF toolbar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 1.5,
              py: 0.5,
              borderBottom: '1px solid',
              borderColor: 'grey.200',
              bgcolor: 'grey.50',
              flexShrink: 0,
            }}
          >
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              Invoice Preview
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton size="small"><NavigateBeforeIcon sx={{ fontSize: 16 }} /></IconButton>
              <Typography variant="caption">1 / 6</Typography>
              <IconButton size="small"><NavigateNextIcon sx={{ fontSize: 16 }} /></IconButton>
              <IconButton size="small"><ZoomOutIcon sx={{ fontSize: 16 }} /></IconButton>
              <IconButton size="small"><ZoomInIcon sx={{ fontSize: 16 }} /></IconButton>
            </Box>
          </Box>

          {/* PDF content */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <PdfContent invoice={currentInvoice} isMobile={false} />
          </Box>
        </Box>
      )}
    </Box>
  );
}
