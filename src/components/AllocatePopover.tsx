import { useState } from 'react';
import {
  Popover,
  SwipeableDrawer,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAllocation } from '../AllocationContext';
import { getLineItemAvailable, getLineItemThisDraw } from '../types';
import type { BudgetCategory } from '../types';

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtFull(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
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
  amount: number;
}

// Shared line-item list content used by both Popover and Drawer
function AllocateContent({
  categories,
  expandedCats,
  toggleCat,
  onSelect,
  isMobile,
  vendorName,
  description,
  amount,
}: {
  categories: BudgetCategory[];
  expandedCats: Set<string>;
  toggleCat: (id: string) => void;
  onSelect: (lineItemId: string) => void;
  isMobile: boolean;
  vendorName: string;
  description: string;
  amount: number;
}) {
  return (
    <>
      {/* Header */}
      <Box sx={{ px: 2, py: isMobile ? 2 : 1.5, borderBottom: '1px solid', borderColor: 'grey.200' }}>
        {isMobile && (
          <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'grey.300', mx: 'auto', mb: 1.5 }} />
        )}
        <Typography variant={isMobile ? 'h6' : 'subtitle2'}>Allocate to Budget Line</Typography>
        <Typography variant="caption" color="text.secondary">
          {vendorName} · {description} · {fmt(amount)}
        </Typography>
      </Box>

      {/* Category / Line Item List */}
      <List dense={!isMobile} disablePadding sx={{ overflow: 'auto', flex: 1 }}>
        {categories.map(cat => (
          <Box key={cat.id}>
            <ListItemButton
              onClick={() => toggleCat(cat.id)}
              sx={{ bgcolor: 'grey.50', py: isMobile ? 1.25 : 0.5 }}
            >
              {expandedCats.has(cat.id) ? (
                <ExpandMoreIcon sx={{ fontSize: 16, mr: 0.5, color: 'grey.600' }} />
              ) : (
                <ChevronRightIcon sx={{ fontSize: 16, mr: 0.5, color: 'grey.600' }} />
              )}
              <ListItemText
                primary={`${cat.number} ${cat.name}`}
                primaryTypographyProps={{ variant: 'caption', fontWeight: 700, fontSize: isMobile ? '0.85rem' : undefined }}
              />
            </ListItemButton>
            <Collapse in={expandedCats.has(cat.id)}>
              {cat.lineItems.map(li => {
                const avail = getLineItemAvailable(li);
                const thisDraw = getLineItemThisDraw(li);
                const hasAllocations = li.allocations.length > 0;

                return (
                  <Box key={li.id}>
                    <ListItemButton
                      onClick={() => onSelect(li.id)}
                      sx={{
                        pl: 4,
                        py: isMobile ? 1.25 : 0.5,
                        minHeight: isMobile ? 48 : undefined,
                        '&:hover': { bgcolor: 'primary.lighter' },
                      }}
                    >
                      <ListItemText
                        primary={`${li.number} ${li.description}`}
                        primaryTypographyProps={{ variant: 'body2', fontSize: isMobile ? '0.875rem' : '0.8rem' }}
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

                    {/* Existing allocations in this draw */}
                    {hasAllocations && (
                      <Box sx={{ pl: isMobile ? 5 : 5.5, pr: 2, pb: 0.5 }}>
                        {li.allocations.map(a => (
                          <Typography
                            key={a.id}
                            variant="caption"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              fontSize: '0.675rem',
                              color: 'text.secondary',
                              py: 0.125,
                            }}
                          >
                            <Box component="span" sx={{ color: 'primary.main' }}>↳</Box>
                            {a.vendorName}
                            <Box component="span" sx={{ color: 'grey.400' }}>·</Box>
                            <Box component="span" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                              {fmtFull(a.amount)}
                            </Box>
                          </Typography>
                        ))}
                        {thisDraw > 0 && (
                          <Typography variant="caption" sx={{ fontSize: '0.625rem', color: 'grey.400', display: 'block', mt: 0.25 }}>
                            {fmt(thisDraw)} in this draw
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Collapse>
          </Box>
        ))}
      </List>
    </>
  );
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
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

  const contentProps = {
    categories,
    expandedCats,
    toggleCat,
    onSelect: handleSelect,
    isMobile,
    vendorName,
    description,
    amount,
  };

  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            maxHeight: '75vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <AllocateContent {...contentProps} />
      </SwipeableDrawer>
    );
  }

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
      <AllocateContent {...contentProps} />
    </Popover>
  );
}
