import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Checkbox,
  Button,
  IconButton,
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { useAllocation } from '../AllocationContext';
import type { Invoice } from '../types';

function fmtCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

interface EditInvoicesModalProps {
  open: boolean;
  onClose: () => void;
}

export default function EditInvoicesModal({ open, onClose }: EditInvoicesModalProps) {
  const { allInvoices, selectedIds, toggleInvoice, clearInvoiceAllocations } = useAllocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Local selection state to allow "cancel" behavior
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(new Set(selectedIds));

  // Reset local state when modal opens
  useMemo(() => {
    if (open) {
      setLocalSelectedIds(new Set(selectedIds));
      setSearchQuery('');
    }
  }, [open, selectedIds]);

  // Filter invoices by search query
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return allInvoices;
    const query = searchQuery.toLowerCase();
    return allInvoices.filter(
      inv =>
        inv.vendorName.toLowerCase().includes(query) ||
        inv.invoiceNumber.toLowerCase().includes(query)
    );
  }, [allInvoices, searchQuery]);

  const handleToggle = (invoiceId: string) => {
    setLocalSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(invoiceId)) {
        next.delete(invoiceId);
      } else {
        next.add(invoiceId);
      }
      return next;
    });
  };

  const handleSave = () => {
    // Sync local selection to context
    // First, add any newly selected invoices
    for (const id of localSelectedIds) {
      if (!selectedIds.has(id)) {
        toggleInvoice(id);
      }
    }
    // Then, remove any deselected invoices (clear allocations first)
    for (const id of selectedIds) {
      if (!localSelectedIds.has(id)) {
        // Clear allocations before removing (this also removes associated COs)
        clearInvoiceAllocations(id);
        toggleInvoice(id);
      }
    }
    onClose();
  };

  const selectedCount = localSelectedIds.size;
  const totalAmount = allInvoices
    .filter(inv => localSelectedIds.has(inv.id))
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, fontWeight: 700 }}>
        Edit Invoices
        <IconButton size="small" onClick={onClose} sx={{ ml: 'auto' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {/* Search bar */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search invoices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Invoice list */}
        <Box sx={{ maxHeight: 400, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {filteredInvoices.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No invoices found
            </Typography>
          ) : (
            filteredInvoices.map((invoice) => (
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                isSelected={localSelectedIds.has(invoice.id)}
                onToggle={() => handleToggle(invoice.id)}
              />
            ))
          )}
        </Box>

        {/* Summary */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 2,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {selectedCount} invoice{selectedCount !== 1 ? 's' : ''} selected
          </Typography>
          <Typography variant="body1" fontWeight={700}>
            {fmtCurrency(totalAmount)}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} sx={{ textTransform: 'none' }}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function InvoiceRow({
  invoice,
  isSelected,
  onToggle,
}: {
  invoice: Invoice;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <Box
      onClick={onToggle}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1,
        py: 1,
        borderRadius: 1,
        cursor: 'pointer',
        bgcolor: isSelected ? 'primary.lighter' : 'transparent',
        '&:hover': { bgcolor: isSelected ? 'primary.lighter' : 'grey.50' },
        transition: 'background-color 0.15s',
      }}
    >
      <Checkbox
        checked={isSelected}
        size="small"
        sx={{ p: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        onChange={onToggle}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {invoice.vendorName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {invoice.invoiceNumber} · Received{' '}
          {new Date(invoice.receivedDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </Typography>
      </Box>
      <Typography variant="body2" fontWeight={600} sx={{ flexShrink: 0 }}>
        {fmtCurrency(invoice.amount)}
      </Typography>
    </Box>
  );
}
