import { Box, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TableChartIcon from '@mui/icons-material/TableChart';
import SendIcon from '@mui/icons-material/Send';

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
  return (
    <Box
      sx={{
        height: 56,
        minHeight: 56,
        bgcolor: 'grey.900',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        px: 2,
        position: 'relative',
      }}
    >
      {steps.map((step, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Step circle + label */}
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

          {/* Connecting line between steps */}
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
  );
}
