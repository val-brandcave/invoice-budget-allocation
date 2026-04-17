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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { useDraggable } from '@dnd-kit/core';
import { useAllocation } from '../AllocationContext';
import {
  getInvoiceAllocatedAmount,
  getInvoiceProgress,
  getInvoiceStatus,
  getInvoiceCOStatus,
} from '../types';
import type { Invoice, BudgetCategory } from '../types';
import AllocatePopover from './AllocatePopover';
import AttachmentViewer from './AttachmentViewer';
import EditInvoicesModal from './EditInvoicesModal';

function fmtFull(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

// Editable AI summary
function EditableSummary({
  invoice,
}: {
  invoice: Invoice;
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

// Draggable invoice card — split into compact drag strip + static detail section
function DraggableInvoiceCard({
  invoice,
  categories,
  isMobile,
  onPreview,
}: {
  invoice: Invoice;
  categories: BudgetCategory[];
  isMobile: boolean;
  onPreview?: () => void;
}) {
  const { toggleInvoice, pendingChangeOrders, clearInvoiceAllocations } = useAllocation();
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<HTMLElement | null>(null);
  const [desktopMenuAnchor, setDesktopMenuAnchor] = useState<HTMLElement | null>(null);
  const status = getInvoiceStatus(invoice, categories);
  const progress = getInvoiceProgress(invoice, categories);
  const allocated = getInvoiceAllocatedAmount(invoice, categories);
  const remaining = invoice.amount - allocated;
  const isFullyAllocated = status === 'fully_allocated';

  // CO status for this invoice
  const coStatusResult = getInvoiceCOStatus(invoice, categories, pendingChangeOrders);
  const coStatus = coStatusResult.status;
  const hasAnyOverBudget = coStatus !== 'none';

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

  // P3: Edit handler (dummy for prototype)
  const handleEdit = () => {
    console.log('Edit invoice:', invoice.id);
    setMobileMenuAnchor(null);
  };

  // P3: Remove handler - opens confirmation dialog
  const handleRemoveClick = () => {
    setMobileMenuAnchor(null);
    setConfirmRemoveOpen(true);
  };

  // P3: Confirm remove - clears allocations and unchecks invoice, returns to available pool
  const handleConfirmRemove = () => {
    // Clear allocations first (this also removes associated COs)
    clearInvoiceAllocations(invoice.id);
    toggleInvoice(invoice.id);
    setConfirmRemoveOpen(false);
  };

  // Left border color based on CO status
  const getLeftBorderColor = () => {
    if (coStatus === 'needs_co') return 'warning.main';
    if (coStatus === 'has_co') return 'info.main';
    return 'transparent';
  };

  // Mobile fully-allocated: compact strip only
  if (isMobile && isFullyAllocated) {
    return (
      <Box
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'success.light',
          bgcolor: 'success.lighter',
          overflow: 'hidden',
          flexShrink: 0,
          // CO status: left border accent even on compact card
          borderLeft: hasAnyOverBudget ? '3px solid' : '1px solid',
          borderLeftColor: hasAnyOverBudget ? getLeftBorderColor() : 'success.light',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 1,
            height: 44,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main', flexShrink: 0 }} />
          {/* CO indicator dot on mobile compact */}
          {coStatus === 'needs_co' && (
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', flexShrink: 0, ml: -0.5 }} />
          )}
          {coStatus === 'has_co' && (
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main', flexShrink: 0, ml: -0.5 }} />
          )}
          <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0 }}>
            {invoice.vendorName}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {invoice.invoiceNumber}
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ flexShrink: 0, ml: 0.5 }}>
            {fmtFull(invoice.amount)}
          </Typography>
          {onPreview && (
            <IconButton
              size="small"
              onClick={onPreview}
              sx={{ ml: 0.25, p: 0.5, color: 'grey.500' }}
            >
              <VisibilityIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: isFullyAllocated ? 'success.light' : isDragging ? 'primary.main' : 'grey.200',
        bgcolor: isFullyAllocated ? 'success.lighter' : 'background.paper',
        overflow: 'hidden',
        boxShadow: isDragging ? '0 0 0 2px rgba(25, 57, 183, 0.15)' : 0,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        flexShrink: 0,
        // CO status: left border accent
        borderLeft: hasAnyOverBudget ? '3px solid' : '1px solid',
        borderLeftColor: hasAnyOverBudget ? getLeftBorderColor() : (isFullyAllocated ? 'success.light' : isDragging ? 'primary.main' : 'grey.200'),
      }}
    >
      {/* ── HEADER ROW with drag handle + action icons (P3, P4) ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 0.5,
          minHeight: isMobile ? 44 : 40,
          bgcolor: isDragging ? 'primary.lighter' : isFullyAllocated ? 'success.lighter' : 'grey.50',
          borderBottom: '1px solid',
          borderColor: isDragging ? 'primary.light' : 'grey.100',
        }}
      >
        {/* Drag handle area with tooltip (P4) */}
        <Tooltip title={isMobile || isFullyAllocated ? '' : 'Drag and drop to allocate'} placement="top" arrow>
          <Box
            ref={isMobile ? undefined : setNodeRef}
            {...dragProps}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              flex: 1,
              minWidth: 0,
              cursor: isMobile ? 'default' : isFullyAllocated ? 'default' : 'grab',
              '&:active': isMobile || isFullyAllocated ? {} : { cursor: 'grabbing' },
              opacity: isDragging ? 0.4 : 1,
              py: 0.25,
              borderRadius: 1,
              '&:hover': isMobile || isFullyAllocated ? {} : { bgcolor: 'primary.lighter' },
              transition: 'background-color 0.15s, opacity 0.15s',
            }}
          >
            {!isMobile && !isFullyAllocated && (
              <DragIndicatorIcon sx={{ fontSize: 16, color: 'grey.400', flexShrink: 0 }} />
            )}
            {isFullyAllocated && (
              <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', flexShrink: 0 }} />
            )}
            <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0 }}>
              {invoice.vendorName}
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                {invoice.invoiceNumber}
              </Typography>
            </Typography>
            {/* Budget Status Badge - moved from bottom to header */}
            {coStatus === 'needs_co' && (
              <Chip
                icon={<WarningAmberIcon sx={{ fontSize: '12px !important' }} />}
                label={coStatusResult.overBudgetCount === 1 ? 'Over Budget' : `${coStatusResult.overBudgetCount} Over Budget`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  bgcolor: 'warning.lighter',
                  color: 'warning.dark',
                  flexShrink: 0,
                  '& .MuiChip-icon': { color: 'warning.main' },
                }}
              />
            )}
            {coStatus === 'has_co' && (
              <Chip
                icon={<AssignmentTurnedInIcon sx={{ fontSize: '12px !important' }} />}
                label={coStatusResult.coNumbers.length === 1 ? 'Adjustment Requested' : `${coStatusResult.coNumbers.length} Adjustments`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  bgcolor: 'info.lighter',
                  color: 'info.dark',
                  flexShrink: 0,
                  '& .MuiChip-icon': { color: 'info.main' },
                }}
              />
            )}
            <Typography variant="body2" fontWeight={700} sx={{ flexShrink: 0, ml: 0.5 }}>
              {fmtFull(invoice.amount)}
            </Typography>
          </Box>
        </Tooltip>

        {/* P3: Action icons - Desktop: plus icon + menu, Mobile: kebab menu */}
        {!isMobile ? (
          <>
            {/* Desktop: Plus icon for allocation */}
            {!isFullyAllocated && remaining > 0 && (
              <Tooltip title="Allocate to budget" placement="top" arrow>
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); setPopoverAnchor(e.currentTarget); }}
                  sx={{
                    color: 'primary.main',
                    p: 0.5,
                    '&:hover': { bgcolor: 'primary.lighter' },
                  }}
                >
                  <AddIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
            {/* Desktop: More menu with View, Edit, Remove */}
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); setDesktopMenuAnchor(e.currentTarget); }}
              sx={{
                color: 'text.secondary',
                p: 0.5,
                '&:hover': { bgcolor: 'grey.200' },
              }}
            >
              <MoreVertIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Menu
              anchorEl={desktopMenuAnchor}
              open={Boolean(desktopMenuAnchor)}
              onClose={() => setDesktopMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={() => { setDesktopMenuAnchor(null); onPreview?.(); }}>
                <ListItemIcon>
                  <VisibilityIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>View Invoice</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setDesktopMenuAnchor(null); handleEdit(); }}>
                <ListItemIcon>
                  <EditOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Edit Invoice</ListItemText>
              </MenuItem>
              {allocated > 0 && (
                <MenuItem onClick={() => { setDesktopMenuAnchor(null); clearInvoiceAllocations(invoice.id); }}>
                  <ListItemIcon>
                    <CloseIcon fontSize="small" sx={{ color: 'warning.main' }} />
                  </ListItemIcon>
                  <ListItemText sx={{ color: 'warning.main' }}>Clear Allocation</ListItemText>
                </MenuItem>
              )}
              <MenuItem onClick={() => { setDesktopMenuAnchor(null); handleRemoveClick(); }}>
                <ListItemIcon>
                  <DeleteOutlineIcon fontSize="small" sx={{ color: 'error.main' }} />
                </ListItemIcon>
                <ListItemText sx={{ color: 'error.main' }}>Remove from Request</ListItemText>
              </MenuItem>
            </Menu>
          </>
        ) : (
          <>
            {/* Mobile: Preview button */}
            {onPreview && (
              <IconButton
                size="small"
                onClick={onPreview}
                sx={{ p: 0.5, color: 'grey.500' }}
              >
                <VisibilityIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            {/* Mobile: Kebab menu with all actions */}
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); setMobileMenuAnchor(e.currentTarget); }}
              sx={{ p: 0.5, color: 'grey.500' }}
            >
              <MoreVertIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchor}
              open={Boolean(mobileMenuAnchor)}
              onClose={() => setMobileMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              {!isFullyAllocated && remaining > 0 && (
                <MenuItem onClick={(e) => { setMobileMenuAnchor(null); setPopoverAnchor(e.currentTarget as HTMLElement); }}>
                  <ListItemIcon>
                    <AddIcon fontSize="small" sx={{ color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText>Allocate to budget</ListItemText>
                </MenuItem>
              )}
              <MenuItem onClick={handleEdit}>
                <ListItemIcon>
                  <EditOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Edit invoice</ListItemText>
              </MenuItem>
              {allocated > 0 && (
                <MenuItem onClick={() => { setMobileMenuAnchor(null); clearInvoiceAllocations(invoice.id); }}>
                  <ListItemIcon>
                    <CloseIcon fontSize="small" sx={{ color: 'warning.main' }} />
                  </ListItemIcon>
                  <ListItemText sx={{ color: 'warning.main' }}>Clear Allocation</ListItemText>
                </MenuItem>
              )}
              <MenuItem onClick={handleRemoveClick}>
                <ListItemIcon>
                  <DeleteOutlineIcon fontSize="small" sx={{ color: 'error.main' }} />
                </ListItemIcon>
                <ListItemText sx={{ color: 'error.main' }}>Remove from request</ListItemText>
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>

      {/* P3: Confirmation dialog for removing invoice */}
      <Dialog
        open={confirmRemoveOpen}
        onClose={() => setConfirmRemoveOpen(false)}
        maxWidth="xs"
      >
        <DialogTitle>Remove Invoice?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove <strong>{invoice.vendorName}</strong> ({invoice.invoiceNumber})
            from this payment request? The invoice will be returned to the available pool.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemoveOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRemove}
            color="error"
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── DETAIL SECTION — static, not draggable ── */}
      <Box sx={{ px: 1.5, py: 1.25 }}>
        {/* Date */}
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          Received {new Date(invoice.receivedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Typography>

        {/* AI Summary — editable on click */}
        <EditableSummary invoice={invoice} />

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
          <Typography variant="caption" fontWeight={600} sx={{ minWidth: 52, textAlign: 'right', fontSize: '0.7rem' }}>
            {fmtFull(allocated)}
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
        {isFullyAllocated && (
          <Typography variant="caption" color="success.main" fontWeight={600} sx={{ fontSize: '0.7rem', mt: 0.5, display: 'block' }}>
            Fully allocated
          </Typography>
        )}
        {/* CO Status badges moved to header row */}
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
  const { invoices, categories, totalThisDraw, pendingChangeOrders, toggleInvoice, clearInvoiceAllocations } = useAllocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pdfDrawerOpen, setPdfDrawerOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [editInvoicesOpen, setEditInvoicesOpen] = useState(false); // P6: Edit Invoices modal
  // Tab close confirmation state
  const [tabRemoveTarget, setTabRemoveTarget] = useState<Invoice | null>(null);
  const [tabRemoveConfirmOpen, setTabRemoveConfirmOpen] = useState(false);

  const currentInvoice = invoices[currentIndex] || null;

  const handlePrev = () => setCurrentIndex(i => Math.max(0, i - 1));
  const handleNext = () => setCurrentIndex(i => Math.min(invoices.length - 1, i + 1));

  const handleMobilePreview = (invoice: Invoice) => {
    setPreviewInvoice(invoice);
    setPdfDrawerOpen(true);
  };

  // ── MOBILE: vertical card list ──
  if (isMobile) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          bgcolor: 'grey.50',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'grey.200',
            bgcolor: 'background.paper',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" fontWeight={700}>
                Invoices
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                ({currentIndex + 1}/{invoices.length})
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setEditInvoicesOpen(true)}
              sx={{
                textTransform: 'none',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}
            >
              Edit Invoices
            </Button>
          </Box>

          {totalThisDraw > 0 && (
            <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ mt: 0.5, display: 'block' }}>
              This Request: {fmtFull(totalThisDraw)}
            </Typography>
          )}
        </Box>

        {/* Scrollable card list */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            px: 2,
            py: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {invoices.map((inv) => (
            <DraggableInvoiceCard
              key={inv.id}
              invoice={inv}
              categories={categories}
              isMobile
              onPreview={() => handleMobilePreview(inv)}
            />
          ))}
        </Box>

        {/* Attachment viewer drawer — triggered per card */}
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
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {previewInvoice?.invoiceNumber ?? 'Invoice'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {previewInvoice?.vendorName}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setPdfDrawerOpen(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ flex: 1, m: 2, mt: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <AttachmentViewer
              attachments={previewInvoice?.attachments ?? []}
              isMobile
            />
          </Box>
        </SwipeableDrawer>
      </Box>
    );
  }

  // ── DESKTOP: tabs + single card + inline PDF preview ──
  return (
    <Box
      sx={{
        flex: '0 0 auto',
        width: '40vw',
        minWidth: 380,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: 'grey.50',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'background.paper',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" fontWeight={700}>
              Invoices
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              ({currentIndex + 1}/{invoices.length})
            </Typography>
          </Box>
          {/* P6: Edit Invoices action */}
          <Button
            size="small"
            variant="outlined"
            onClick={() => setEditInvoicesOpen(true)}
            sx={{
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
          >
            Edit Invoices
          </Button>
        </Box>
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
              px: 1,
              py: 0.5,
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 500,
              // Show close button on hover
              '& .tab-close-btn': {
                opacity: 0,
                transition: 'opacity 0.15s',
              },
              '&:hover .tab-close-btn': {
                opacity: 1,
              },
            },
            '& .Mui-selected': {
              fontWeight: 700,
              // Always show close button on active tab
              '& .tab-close-btn': {
                opacity: 1,
              },
            },
            '& .MuiTabs-scrollButtons': {
              width: 28,
            },
          }}
        >
          {invoices.map((inv, idx) => {
            const invStatus = getInvoiceStatus(inv, categories);
            const isAllocated = invStatus === 'fully_allocated';
            const invCOStatus = getInvoiceCOStatus(inv, categories, pendingChangeOrders);
            // Extract last 4 characters of invoice number for badge
            const invoiceBadge = inv.invoiceNumber.slice(-4);

            return (
              <Tab
                key={inv.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {/* Status icon */}
                    {isAllocated && <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main', flexShrink: 0 }} />}
                    {/* CO indicator dot */}
                    {!isAllocated && invCOStatus.status === 'needs_co' && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'warning.main',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    {!isAllocated && invCOStatus.status === 'has_co' && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'info.main',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    {/* Vendor name (first word) */}
                    <span>{inv.vendorName.split(' ')[0]}</span>
                    {/* Invoice number badge - always visible */}
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '0.65rem',
                        color: 'text.secondary',
                        fontWeight: 500,
                        ml: 0.25,
                      }}
                    >
                      #{invoiceBadge}
                    </Typography>
                    {/* Close button - visible on hover/active (Box instead of IconButton to avoid nested button) */}
                    <Box
                      className="tab-close-btn"
                      component="span"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        e.preventDefault();
                        // Use the same remove flow as the card menu
                        const allocated = getInvoiceAllocatedAmount(inv, categories);
                        if (allocated > 0) {
                          // Has allocations - need to show confirmation
                          setTabRemoveTarget(inv);
                          setTabRemoveConfirmOpen(true);
                        } else {
                          // No allocations - remove directly (still clear allocations for safety)
                          clearInvoiceAllocations(inv.id);
                          toggleInvoice(inv.id);
                          // Adjust index if needed
                          if (idx <= currentIndex && currentIndex > 0) {
                            setCurrentIndex(currentIndex - 1);
                          }
                        }
                      }}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 0.25,
                        ml: 0.5,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        color: 'text.secondary',
                        transition: 'all 0.15s',
                        '&:hover': {
                          bgcolor: 'error.lighter',
                          color: 'error.main',
                        },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 12 }} />
                    </Box>
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
      </Box>

      {/* Current invoice card — draggable */}
      <Box sx={{ px: 2, pt: 1.5, flexShrink: 0 }}>
        {currentInvoice && (
          <DraggableInvoiceCard
            invoice={currentInvoice}
            categories={categories}
            isMobile={false}
          />
        )}
      </Box>

      {/* Attachment viewer — inline on desktop */}
      <Box sx={{ flex: 1, minHeight: 0, m: 1.5, mt: 1, display: 'flex', flexDirection: 'column' }}>
        <AttachmentViewer
          attachments={currentInvoice?.attachments ?? []}
        />
      </Box>

      {/* Sticky footer with Next/Previous navigation */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderTop: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          startIcon={<NavigateBeforeIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            minWidth: 100,
          }}
        >
          Previous
        </Button>
        <Typography variant="caption" color="text.secondary">
          {currentIndex + 1} of {invoices.length}
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={handleNext}
          disabled={currentIndex === invoices.length - 1}
          endIcon={<NavigateNextIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            minWidth: 100,
          }}
        >
          Next
        </Button>
      </Box>

      {/* P6: Edit Invoices modal */}
      <EditInvoicesModal
        open={editInvoicesOpen}
        onClose={() => setEditInvoicesOpen(false)}
      />

      {/* Tab close confirmation dialog */}
      <Dialog
        open={tabRemoveConfirmOpen}
        onClose={() => setTabRemoveConfirmOpen(false)}
        maxWidth="xs"
      >
        <DialogTitle>Remove Invoice?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove <strong>{tabRemoveTarget?.vendorName}</strong> ({tabRemoveTarget?.invoiceNumber})
            from this payment request? This invoice has allocations that will be cleared.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTabRemoveConfirmOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (tabRemoveTarget) {
                const idx = invoices.findIndex(inv => inv.id === tabRemoveTarget.id);
                // Clear allocations first (this also removes associated COs)
                clearInvoiceAllocations(tabRemoveTarget.id);
                toggleInvoice(tabRemoveTarget.id);
                // Adjust current index if needed
                if (idx <= currentIndex && currentIndex > 0) {
                  setCurrentIndex(currentIndex - 1);
                }
              }
              setTabRemoveConfirmOpen(false);
              setTabRemoveTarget(null);
            }}
            color="error"
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
