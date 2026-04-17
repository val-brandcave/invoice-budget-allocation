import { Box, Typography } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import type { DragData } from '../types';

function fmtFull(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

export default function DragOverlayCard({ data }: { data: DragData }) {
  return (
    <Box
      sx={{
        height: 36,
        px: 1.5,
        borderRadius: 1.5,
        bgcolor: 'background.paper',
        border: '2px solid',
        borderColor: 'primary.main',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        opacity: 0.95,
        transform: 'rotate(1.5deg)',
        maxWidth: 360,
        whiteSpace: 'nowrap',
      }}
    >
      <DragIndicatorIcon sx={{ fontSize: 16, color: 'primary.main', flexShrink: 0 }} />
      <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0 }}>
        {data.vendorName}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
        {data.invoiceNumber}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ color: 'primary.main', flexShrink: 0, ml: 0.5 }}>
        {fmtFull(data.remainingAmount)}
      </Typography>
    </Box>
  );
}
