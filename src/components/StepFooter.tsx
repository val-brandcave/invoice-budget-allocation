import { Box, Typography, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TableChartIcon from '@mui/icons-material/TableChart';
import SendIcon from '@mui/icons-material/Send';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAllocation } from '../AllocationContext';
import { getInvoiceStatus } from '../types';

interface Step {
  icon: React.ReactNode;
  label: string;
  state: 'complete' | 'active' | 'locked';
}

const steps: Step[] = [
  { icon: <ReceiptLongIcon sx={{ fontSize: 18 }} />, label: 'Select', state: 'complete' },
  { icon: <TableChartIcon sx={{ fontSize: 18 }} />, label: 'Allocate', state: 'active' },
  { icon: <SendIcon sx={{ fontSize: 18 }} />, label: 'Review', state: 'locked' },
];

export default function StepFooter() {
  const { invoices, categories } = useAllocation();
  const fullyAllocated = invoices.filter(
    inv => getInvoiceStatus(inv, categories) === 'fully_allocated'
  ).length;
  const allDone = fullyAllocated === invoices.length;

  return (
    <Box
      sx={{
        height: 56,
        minHeight: 56,
        bgcolor: 'grey.900',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        position: 'relative',
      }}
    >
      {/* Steps */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {steps.map((step, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                opacity: step.state === 'locked' ? 0.4 : 1,
              }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: step.state === 'active' ? 'primary.main' : 'transparent',
                  color: step.state === 'active' ? '#fff' : step.state === 'complete' ? 'success.main' : 'grey.600',
                  border: step.state === 'active' ? 'none' : '1.5px solid',
                  borderColor: step.state === 'complete' ? 'success.main' : 'grey.700',
                }}
              >
                {step.state === 'complete' ? <CheckCircleIcon sx={{ fontSize: 18 }} /> : step.icon}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: step.state === 'active' ? '#fff' : step.state === 'complete' ? 'success.main' : 'grey.500',
                  fontWeight: step.state === 'active' ? 700 : 500,
                  fontSize: '0.7rem',
                }}
              >
                {step.label}
              </Typography>
            </Box>

            {i < steps.length - 1 && (
              <Box
                sx={{
                  width: 32,
                  height: 1.5,
                  bgcolor: step.state === 'complete' ? 'success.main' : 'grey.700',
                  mx: 1,
                  opacity: steps[i + 1].state === 'locked' ? 0.4 : 1,
                }}
              />
            )}
          </Box>
        ))}
      </Box>

      {/* Next button with progress */}
      <Button
        variant="contained"
        size="small"
        endIcon={<ArrowForwardIcon sx={{ fontSize: '16px !important' }} />}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8rem',
          px: 2,
          py: 0.75,
          borderRadius: 1.5,
          bgcolor: allDone ? 'success.main' : 'primary.main',
          '&:hover': {
            bgcolor: allDone ? 'success.dark' : 'primary.dark',
          },
        }}
      >
        {allDone
          ? 'Next: Review'
          : `Next: Review (${fullyAllocated}/${invoices.length})`}
      </Button>
    </Box>
  );
}
