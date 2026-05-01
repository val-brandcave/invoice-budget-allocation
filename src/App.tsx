import { useState, useRef, useCallback } from 'react';
import {
  Box,
  CssBaseline,
  ThemeProvider,
  useMediaQuery,
  useTheme,
  Typography,
  IconButton,
  Modal,
  Paper,
  Button,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Chip from '@mui/material/Chip';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import theme from './theme';
import { AllocationProvider, useAllocation } from './AllocationContext';
import StepFooter from './components/StepFooter';
import BudgetTable from './components/BudgetTable';
import InvoicePanel from './components/InvoicePanel';
import DragOverlayCard from './components/DragOverlayCard';
import COSummaryModal from './components/COSummaryModal';
import { getInvoiceAllocatedAmount } from './types';
import type { DragData } from './types';

function AllocateStepDesktop() {
  const { categories, invoices, addAllocation } = useAllocation();
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
  const [splitPct, setSplitPct] = useState(35);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(60, Math.max(20, pct)));
    };
    const onUp = () => {
      draggingRef.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    if (data) setActiveDrag(data);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);

    const { active, over } = event;
    if (!over) return;

    const dragData = active.data.current as DragData | undefined;
    if (!dragData) return;

    const droppableId = over.id as string;
    if (!droppableId.startsWith('drop-')) return;
    const lineItemId = droppableId.replace('drop-', '');

    const invoice = invoices.find(i => i.id === dragData.invoiceId);
    if (!invoice) return;
    const amount = invoice.amount - getInvoiceAllocatedAmount(invoice, categories);

    if (amount <= 0) return;

    addAllocation(lineItemId, {
      invoiceId: dragData.invoiceId,
      invoiceSubItemId: dragData.subItemId,
      vendorName: dragData.vendorName,
      invoiceNumber: dragData.invoiceNumber,
      description: dragData.description,
      amount,
      mode: 'fixed',
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box ref={containerRef} sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Box sx={{ width: `${splitPct}%`, minWidth: 0, flexShrink: 0, display: 'flex' }}>
          <InvoicePanel />
        </Box>
        <Box
          onMouseDown={handleResizeStart}
          sx={{
            width: 4,
            flexShrink: 0,
            cursor: 'col-resize',
            bgcolor: 'grey.300',
            transition: 'background-color 0.15s',
            '&:hover': { bgcolor: 'primary.main' },
            zIndex: 10,
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex' }}>
          <BudgetTable />
        </Box>
      </Box>

      <DragOverlay dropAnimation={null}>
        {activeDrag ? <DragOverlayCard data={activeDrag} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

// Single-step flow - directly show allocation view

function CompletionModal() {
  const { showCompletionModal, setShowCompletionModal, selectedPRId, draftPRs, selectedTotal, selectedInvoices, pendingChangeOrders, sessionCONumber } = useAllocation();

  const selectedPR = draftPRs.find(pr => pr.id === selectedPRId);
  const prLabel = selectedPR ? selectedPR.prNumber : 'New Payment Request';
  const hasCOs = pendingChangeOrders.length > 0;

  const fmtCurrency = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

  return (
    <Modal
      open={showCompletionModal}
      onClose={() => setShowCompletionModal(false)}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Paper
        sx={{
          width: '100%',
          maxWidth: 420,
          mx: 2,
          p: 3,
          borderRadius: 0,
          outline: 'none',
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CheckCircleOutlineIcon sx={{ fontSize: 56, color: 'success.main' }} />
          <Typography variant="h6" fontWeight={700} textAlign="center">
            Payment Request Updated
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {selectedInvoices.length} invoice{selectedInvoices.length !== 1 ? 's' : ''} ({fmtCurrency(selectedTotal)}) added to <strong>{prLabel}</strong>
          </Typography>

          {hasCOs && (
            <Box
              sx={{
                width: '100%',
                p: 1.5,
                borderRadius: 0,
                bgcolor: 'info.lighter',
                border: '1px solid',
                borderColor: 'info.light',
              }}
            >
              <Typography variant="body2" color="info.dark" textAlign="center">
                Budget adjustment <strong>{sessionCONumber}</strong> ({pendingChangeOrders.length} item{pendingChangeOrders.length !== 1 ? 's' : ''}) submitted for homeowner review.
              </Typography>
            </Box>
          )}
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setShowCompletionModal(false)}
            sx={{ textTransform: 'none' }}
          >
            Done
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setShowCompletionModal(false)}
            sx={{ textTransform: 'none' }}
          >
            Send Now
          </Button>
        </Stack>
      </Paper>
    </Modal>
  );
}

function DesktopLayout() {
  const {
    goNext,
    canProceed,
    selectedPRId,
    draftPRs,
    allInvoicesAllocated,
    allAdjustmentsResolved,
    unresolvedAdjustmentCount,
    pendingChangeOrders,
  } = useAllocation();

  const selectedPR = draftPRs.find(pr => pr.id === selectedPRId);

  // Determine footer warning message
  let warningMessage = '';
  if (allInvoicesAllocated && !allAdjustmentsResolved) {
    warningMessage = `${unresolvedAdjustmentCount} over-budget line${unresolvedAdjustmentCount !== 1 ? 's' : ''} need${unresolvedAdjustmentCount === 1 ? 's' : ''} adjustment`;
  }

  // Info message for resolved COs
  const hasPendingCOs = pendingChangeOrders.length > 0 && allAdjustmentsResolved;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: 'grey.100' }}>
      {/* ── Full-width header ── */}
      <Box
        sx={{
          height: 52,
          minHeight: 52,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Add to Payment Request
          </Typography>
          {selectedPR && (
            <Chip
              label={selectedPR.prNumber}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.75rem',
                fontWeight: 600,
                bgcolor: 'info.lighter',
                color: 'info.main',
              }}
            />
          )}
        </Box>
        <IconButton size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* ── Middle: Content (full width, no sidebar) ── */}
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', bgcolor: 'grey.100' }}>
        <AllocateStepDesktop />
      </Box>

      {/* ── Full-width footer ── */}
      <Box
        sx={{
          minHeight: 52,
          borderTop: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: 2.5,
          py: 0.75,
          flexShrink: 0,
          gap: 2,
        }}
      >
        {/* Warning: unresolved overages */}
        {warningMessage && (
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mr: 'auto' }}>
            <WarningAmberIcon sx={{ fontSize: 18, color: 'warning.main' }} />
            <Typography variant="body2" color="warning.dark" fontWeight={500}>
              {warningMessage}
            </Typography>
          </Stack>
        )}

        {/* Info: resolved COs count */}
        {hasPendingCOs && !warningMessage && (
          <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
            {pendingChangeOrders.length} budget adjustment{pendingChangeOrders.length !== 1 ? 's' : ''} pending
          </Typography>
        )}

        <Box
          component="button"
          onClick={goNext}
          disabled={!canProceed}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            border: 'none',
            borderRadius: 0,
            bgcolor: 'success.main',
            color: '#fff',
            px: 2,
            py: 0.75,
            cursor: canProceed ? 'pointer' : 'not-allowed',
            fontSize: '0.85rem',
            fontWeight: 600,
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
            opacity: canProceed ? 1 : 0.5,
            '&:hover': canProceed ? { bgcolor: 'success.dark' } : {},
          }}
        >
          Add to Payment Request
        </Box>
      </Box>

      {/* CO Summary Modal (shown before completion if COs exist) */}
      <COSummaryModal />

      {/* Completion Modal */}
      <CompletionModal />
    </Box>
  );
}

function MobileLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'grey.100' }}>
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <InvoicePanel isMobile />
      </Box>
      <StepFooter />
      <COSummaryModal />
      <CompletionModal />
    </Box>
  );
}

function AllocationWorkspace() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'), { noSsr: true });

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AllocationProvider>
        <AllocationWorkspace />
      </AllocationProvider>
    </ThemeProvider>
  );
}
