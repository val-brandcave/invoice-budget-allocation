import { useState } from 'react';
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
import { getInvoiceAllocatedAmount } from './types';
import type { DragData } from './types';

function AllocateStepDesktop() {
  const { categories, invoices, addAllocation } = useAllocation();
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);

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
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <InvoicePanel />
        <BudgetTable />
      </Box>

      <DragOverlay dropAnimation={null}>
        {activeDrag ? <DragOverlayCard data={activeDrag} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

// Single-step flow - directly show allocation view

function CompletionModal() {
  const { showCompletionModal, setShowCompletionModal, selectedPRId, draftPRs, selectedTotal, selectedInvoices } = useAllocation();

  const selectedPR = draftPRs.find(pr => pr.id === selectedPRId);
  const prLabel = selectedPR ? selectedPR.prNumber : 'New Payment Request';

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
          borderRadius: 2,
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
        </Stack>

        {/* P9: Updated button text — "Done" instead of "Close" */}
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
  const { goNext, canProceed, selectedPRId, draftPRs } = useAllocation();

  const selectedPR = draftPRs.find(pr => pr.id === selectedPRId);

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
                bgcolor: 'primary.lighter',
                color: 'primary.main',
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

      {/* ── Full-width footer (single-step: just submit button) ── */}
      <Box
        sx={{
          height: 52,
          minHeight: 52,
          borderTop: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: 2.5,
          flexShrink: 0,
        }}
      >
        <Box
          component="button"
          onClick={goNext}
          disabled={!canProceed}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            border: 'none',
            borderRadius: 1,
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
