import { useState } from 'react';
import { Box, CssBaseline, ThemeProvider, useMediaQuery, useTheme } from '@mui/material';
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
import StepNav from './components/StepNav';
import StepFooter from './components/StepFooter';
import BudgetTable from './components/BudgetTable';
import InvoicePanel from './components/InvoicePanel';
import DragOverlayCard from './components/DragOverlayCard';
import { getInvoiceAllocatedAmount } from './types';
import type { DragData } from './types';

// Desktop layout with drag-and-drop
function DesktopLayout() {
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
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <StepNav />
        <InvoicePanel />
        <BudgetTable />
      </Box>

      <DragOverlay dropAnimation={null}>
        {activeDrag ? <DragOverlayCard data={activeDrag} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

// Mobile layout — no drag, no budget table
function MobileLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Main content: full-width invoice panel */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <InvoicePanel isMobile />
      </Box>

      {/* Step footer */}
      <StepFooter />
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
