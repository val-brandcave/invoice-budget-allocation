import { Box, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAllocation } from '../AllocationContext';

// Single-step mobile footer - just a submit button
export default function StepFooter() {
  const { goNext, canProceed, selectedPRId, draftPRs } = useAllocation();

  const selectedPR = draftPRs.find(pr => pr.id === selectedPRId);
  const prLabel = selectedPR ? selectedPR.prNumber : 'New PR';

  return (
    <Box
      sx={{
        height: 56,
        minHeight: 56,
        bgcolor: 'grey.900',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        px: 2,
      }}
    >
      <Button
        size="small"
        variant="contained"
        disabled={!canProceed}
        onClick={goNext}
        endIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
        sx={{
          textTransform: 'none',
          fontSize: '0.8rem',
          bgcolor: 'success.main',
          '&:hover': { bgcolor: 'success.dark' },
        }}
      >
        Add to {prLabel}
      </Button>
    </Box>
  );
}
