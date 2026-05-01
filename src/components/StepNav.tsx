import { Box, Typography } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TableChartIcon from '@mui/icons-material/TableChart';
import CheckIcon from '@mui/icons-material/Check';
import { useAllocation } from '../AllocationContext';
import type { FlowStep } from '../types';
import { getInvoiceAllocatedAmount } from '../types';

interface StepDef {
  id: FlowStep;
  icon: React.ReactNode;
  shortLabel: string;
}

const STEPS: StepDef[] = [
  { id: 'review', icon: <ReceiptLongIcon sx={{ fontSize: 20 }} />, shortLabel: 'Select Invoices' },
  { id: 'allocate', icon: <TableChartIcon sx={{ fontSize: 20 }} />, shortLabel: 'Allocate to Budget' },
];

const STEP_INDEX: Record<FlowStep, number> = { review: 0, allocate: 1, summary: 2 };

const DONUT_R = 9;
const DONUT_STROKE = 2.5;
const DONUT_SIZE = (DONUT_R + DONUT_STROKE) * 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_R;

function DonutIndicator({ progress, completed }: { progress: number; completed: boolean }) {
  if (completed) {
    return (
      <Box
        sx={{
          width: DONUT_SIZE,
          height: DONUT_SIZE,
          borderRadius: '50%',
          bgcolor: 'success.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <CheckIcon sx={{ fontSize: 14, color: '#fff' }} />
      </Box>
    );
  }

  const dashOffset = DONUT_CIRCUMFERENCE * (1 - Math.min(Math.max(progress, 0), 1));

  return (
    <Box sx={{ width: DONUT_SIZE, height: DONUT_SIZE, flexShrink: 0 }}>
      <svg width={DONUT_SIZE} height={DONUT_SIZE} viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}>
        {/* Background ring */}
        <circle
          cx={DONUT_SIZE / 2}
          cy={DONUT_SIZE / 2}
          r={DONUT_R}
          fill="none"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth={DONUT_STROKE}
        />
        {/* Progress arc */}
        {progress > 0 && (
          <circle
            cx={DONUT_SIZE / 2}
            cy={DONUT_SIZE / 2}
            r={DONUT_R}
            fill="none"
            stroke="#118d57"
            strokeWidth={DONUT_STROKE}
            strokeDasharray={DONUT_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${DONUT_SIZE / 2} ${DONUT_SIZE / 2})`}
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        )}
      </svg>
    </Box>
  );
}

export default function StepNav() {
  const { step, setStep, categories, selectedInvoices, selectedTotal } = useAllocation();
  const activeIndex = STEP_INDEX[step];

  const allocationProgress = (() => {
    if (selectedTotal <= 0) return 0;
    let totalAllocated = 0;
    for (const inv of selectedInvoices) {
      totalAllocated += getInvoiceAllocatedAmount(inv, categories);
    }
    return Math.min(totalAllocated / selectedTotal, 1);
  })();

  const getProgress = (stepId: FlowStep, idx: number): number => {
    if (idx < activeIndex) return 1;
    if (idx > activeIndex) return 0;
    if (stepId === 'allocate') return allocationProgress;
    return 0;
  };

  return (
    <Box
      sx={{
        width: 200,
        minWidth: 200,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'grey.200',
        display: 'flex',
        flexDirection: 'column',
        pt: 2.5,
        px: 1.5,
        gap: 0.5,
        height: '100%',
      }}
    >
      {STEPS.map((s, i) => {
        const isCompleted = i < activeIndex;
        const isActive = i === activeIndex;
        const isLocked = i > activeIndex;
        const progress = getProgress(s.id, i);

        return (
          <Box
            key={s.id}
            onClick={isCompleted ? () => setStep(s.id) : undefined}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 1.25,
              py: 1,
              borderRadius: 0,
              cursor: isCompleted ? 'pointer' : 'default',
              bgcolor: isActive ? 'info.lighter' : 'transparent',
              opacity: isLocked ? 0.4 : 1,
              transition: 'all 0.2s',
              '&:hover': isCompleted ? { bgcolor: 'grey.100' } : {},
            }}
          >
            <Box
              sx={{
                color: isActive ? 'info.main' : isCompleted ? 'text.secondary' : 'grey.400',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              {s.icon}
            </Box>

            <Typography
              variant="body2"
              noWrap
              sx={{
                flex: 1,
                color: isActive ? 'text.primary' : isCompleted ? 'text.secondary' : 'grey.400',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.8rem',
                lineHeight: 1.3,
              }}
            >
              {s.shortLabel}
            </Typography>

            <DonutIndicator progress={progress} completed={isCompleted} />
          </Box>
        );
      })}
    </Box>
  );
}
