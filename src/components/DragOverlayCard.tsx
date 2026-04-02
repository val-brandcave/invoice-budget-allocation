import { Box, Typography, Chip } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import type { DragData } from '../types';

function fmtFull(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

export default function DragOverlayCard({ data }: { data: DragData }) {
  return (
    <Box
      sx={{
        width: 280,
        p: 1.5,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '2px solid',
        borderColor: 'primary.main',
        boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        opacity: 0.95,
        transform: 'rotate(2deg)',
      }}
    >
      <DragIndicatorIcon sx={{ fontSize: 18, color: 'primary.main' }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>{data.vendorName}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Chip
            label={data.invoiceNumber}
            size="small"
            sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'primary.lighter', color: 'primary.dark' }}
          />
          {data.type === 'sub-item' && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {data.description}
            </Typography>
          )}
        </Box>
      </Box>
      <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', color: 'primary.main', flexShrink: 0 }}>
        {fmtFull(data.remainingAmount)}
      </Typography>
    </Box>
  );
}
