import { Box, Tooltip } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TableChartIcon from '@mui/icons-material/TableChart';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface Step {
  icon: React.ReactNode;
  label: string;
  state: 'complete' | 'active' | 'locked';
}

const steps: Step[] = [
  { icon: <ReceiptLongIcon fontSize="small" />, label: 'Select Invoices', state: 'complete' },
  { icon: <TableChartIcon fontSize="small" />, label: 'Allocate to Budget', state: 'active' },
  { icon: <SendIcon fontSize="small" />, label: 'Review & Submit', state: 'locked' },
];

export default function StepNav() {
  return (
    <Box
      sx={{
        width: 48,
        minWidth: 48,
        bgcolor: 'grey.900',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 2,
        gap: 1,
        height: '100vh',
        position: 'relative',
      }}
    >
      {steps.map((step, i) => (
        <Tooltip key={i} title={step.label} placement="right" arrow>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              cursor: step.state === 'complete' ? 'pointer' : 'default',
              bgcolor:
                step.state === 'active'
                  ? 'primary.main'
                  : step.state === 'complete'
                  ? 'transparent'
                  : 'transparent',
              color:
                step.state === 'active'
                  ? '#fff'
                  : step.state === 'complete'
                  ? 'success.main'
                  : 'grey.600',
              border: step.state === 'active' ? 'none' : '1px solid',
              borderColor:
                step.state === 'complete'
                  ? 'success.main'
                  : step.state === 'locked'
                  ? 'grey.700'
                  : 'transparent',
              opacity: step.state === 'locked' ? 0.4 : 1,
              transition: 'all 0.2s',
              '&:hover': step.state === 'complete' ? { bgcolor: 'grey.800' } : {},
            }}
          >
            {step.state === 'complete' ? (
              <CheckCircleIcon fontSize="small" />
            ) : (
              step.icon
            )}
          </Box>
        </Tooltip>
      ))}

      {/* Connecting lines */}
      <Box
        sx={{
          position: 'absolute',
          top: 52,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1,
          height: 8,
          bgcolor: 'success.main',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 96,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1,
          height: 8,
          bgcolor: 'grey.700',
        }}
      />
    </Box>
  );
}
