import { useState } from 'react';
import {
  Popover,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAllocation } from '../AllocationContext';
import { getLineItemAvailable } from '../types';

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface AllocatePopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  subItemId?: string;
  vendorName: string;
  invoiceNumber: string;
  description: string;
  amount: number; // remaining amount to allocate
}

export default function AllocatePopover({
  anchorEl,
  open,
  onClose,
  invoiceId,
  subItemId,
  vendorName,
  invoiceNumber,
  description,
  amount,
}: AllocatePopoverProps) {
  const { categories, addAllocation } = useAllocation();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(categories.filter(c => c.expanded).map(c => c.id))
  );

  const toggleCat = (catId: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleSelect = (lineItemId: string) => {
    addAllocation(lineItemId, {
      invoiceId,
      invoiceSubItemId: subItemId,
      vendorName,
      invoiceNumber,
      description,
      amount,
      mode: 'fixed',
    });
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: { width: 340, maxHeight: 400, borderRadius: 2 },
        },
      }}
    >
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="subtitle2">Allocate to Budget Line</Typography>
        <Typography variant="caption" color="text.secondary">
          {vendorName} · {description} · {fmt(amount)}
        </Typography>
      </Box>
      <List dense disablePadding sx={{ overflow: 'auto', maxHeight: 320 }}>
        {categories.map(cat => (
          <Box key={cat.id}>
            <ListItemButton
              onClick={() => toggleCat(cat.id)}
              sx={{ bgcolor: 'grey.50', py: 0.5 }}
            >
              {expandedCats.has(cat.id) ? (
                <ExpandMoreIcon sx={{ fontSize: 16, mr: 0.5, color: 'grey.600' }} />
              ) : (
                <ChevronRightIcon sx={{ fontSize: 16, mr: 0.5, color: 'grey.600' }} />
              )}
              <ListItemText
                primary={`${cat.number} ${cat.name}`}
                primaryTypographyProps={{ variant: 'caption', fontWeight: 700 }}
              />
            </ListItemButton>
            <Collapse in={expandedCats.has(cat.id)}>
              {cat.lineItems.map(li => {
                const avail = getLineItemAvailable(li);
                return (
                  <ListItemButton
                    key={li.id}
                    onClick={() => handleSelect(li.id)}
                    sx={{
                      pl: 4,
                      py: 0.5,
                      '&:hover': { bgcolor: 'primary.lighter' },
                    }}
                  >
                    <ListItemText
                      primary={`${li.number} ${li.description}`}
                      primaryTypographyProps={{ variant: 'body2', fontSize: '0.8rem' }}
                    />
                    <Chip
                      label={fmt(avail)}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontFamily: 'monospace',
                        bgcolor: avail > 0 ? 'success.lighter' : 'error.lighter',
                        color: avail > 0 ? 'success.main' : 'error.main',
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </Collapse>
          </Box>
        ))}
      </List>
    </Popover>
  );
}
