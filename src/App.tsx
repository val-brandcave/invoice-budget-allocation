import { useState } from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
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
import BudgetTable from './components/BudgetTable';
import InvoicePanel from './components/InvoicePanel';
import DragOverlayCard from './components/DragOverlayCard';
import { getSubItemAllocatedAmount, getInvoiceAllocatedAmount } from './types';
import type { DragData } from './types';

function AllocationWorkspace() {
  const { categories, invoices, addAllocation } = useAllocation();
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    if (data) {
      setActiveDrag(data);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);

    const { active, over } = event;
    if (!over) return;

    const dragData = active.data.current as DragData | undefined;
    if (!dragData) return;

    // Extract lineItemId from droppable id (format: "drop-{lineItemId}")
    const droppableId = over.id as string;
    if (!droppableId.startsWith('drop-')) return;
    const lineItemId = droppableId.replace('drop-', '');

    // Calculate remaining amount for this drag item
    let amount: number;
    if (dragData.type === 'sub-item' && dragData.subItemId) {
      const allocated = getSubItemAllocatedAmount(dragData.subItemId, categories);
      amount = dragData.amount - allocated;
    } else {
      const invoice = invoices.find(i => i.id === dragData.invoiceId);
      if (!invoice) return;
      amount = invoice.amount - getInvoiceAllocatedAmount(invoice, categories);
    }

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
        <BudgetTable />
        <InvoicePanel />
      </Box>

      <DragOverlay dropAnimation={null}>
        {activeDrag ? <DragOverlayCard data={activeDrag} /> : null}
      </DragOverlay>
    </DndContext>
  );
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
