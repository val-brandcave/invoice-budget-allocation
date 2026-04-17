import { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Avatar,
  Paper,
  Button,
  Collapse,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useAllocation } from '../AllocationContext';
import type { Invoice } from '../types';

function fmtCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function InvoiceRow({
  invoice,
  selected,
  onToggle,
}: {
  invoice: Invoice;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.25,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: selected ? 'background.paper' : 'grey.50',
        '&:hover': { bgcolor: 'action.hover' },
        '&:last-child': { borderBottom: 0 },
      }}
    >
      <Avatar
        sx={{
          width: 32,
          height: 32,
          fontSize: '0.7rem',
          fontWeight: 700,
          bgcolor: selected ? 'primary.lighter' : 'grey.200',
          color: selected ? 'primary.dark' : 'text.secondary',
        }}
      >
        {getInitials(invoice.vendorName)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {invoice.vendorName}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {invoice.invoiceNumber}
          {invoice.aiSummary && ` · ${invoice.aiSummary.slice(0, 50)}...`}
        </Typography>
      </Box>
      <Typography variant="body2" fontWeight={selected ? 700 : 600} color={selected ? 'text.primary' : 'text.secondary'} sx={{ flexShrink: 0 }}>
        {fmtCurrency(invoice.amount)}
      </Typography>
      <IconButton
        size="small"
        onClick={onToggle}
        sx={selected ? {
          p: 0.5,
          color: 'text.disabled',
          '&:hover': { color: 'error.main', bgcolor: (t) => alpha(t.palette.error.main, 0.08) },
        } : {
          p: 0.5,
          color: 'primary.main',
          border: 1,
          borderColor: 'primary.main',
          '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
        }}
      >
        {selected ? <CloseIcon sx={{ fontSize: 16 }} /> : <AddIcon sx={{ fontSize: 16 }} />}
      </IconButton>
    </Box>
  );
}

export default function StepReviewSelection() {
  const { allInvoices, selectedIds, toggleInvoice, selectedTotal, draftPRs, selectedPRId, setSelectedPRId } = useAllocation();
  const [addMoreOpen, setAddMoreOpen] = useState(false);

  const selectedInvoices = allInvoices.filter(inv => selectedIds.has(inv.id));
  const unselectedInvoices = allInvoices.filter(inv => !selectedIds.has(inv.id));

  // PR options for radio list
  const prOptions = [
    ...draftPRs.map(pr => {
      const parts = [`${pr.invoiceCount} invoice${pr.invoiceCount !== 1 ? 's' : ''}`, fmtCurrency(pr.totalAmount)];
      return {
        id: pr.id,
        label: pr.prNumber,
        sublabel: parts.join(' · '),
        statusLabel: pr.status === 'queued'
          ? `Scheduled ${new Date(pr.scheduledDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : 'Draft',
        statusColor: pr.status === 'queued' ? 'info' as const : 'default' as const,
      };
    }),
    {
      id: 'new',
      label: 'Create new payment request',
      sublabel: 'Will be added as a draft',
      statusLabel: '',
      statusColor: 'default' as const,
    },
  ];

  const effectiveSelected = selectedPRId || (draftPRs.length > 0 ? draftPRs[0].id : 'new');

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
        {/* Approval Batch */}
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 1.5,
            borderColor: 'primary.main',
            borderWidth: 2,
            overflow: 'hidden',
            mb: 2.5,
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.25,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Approval Batch
                </Typography>
                <Chip
                  label={selectedIds.size}
                  size="small"
                  color="primary"
                  sx={{ height: 22, fontWeight: 700 }}
                />
              </Stack>
              <Typography variant="subtitle2" fontWeight={700}>
                {fmtCurrency(selectedTotal)}
              </Typography>
            </Stack>
          </Box>

          {selectedInvoices.length > 0 ? (
            selectedInvoices.map(inv => (
              <InvoiceRow
                key={inv.id}
                invoice={inv}
                selected
                onToggle={() => toggleInvoice(inv.id)}
              />
            ))
          ) : (
            <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.disabled">
                No invoices selected. Add invoices from below.
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Other invoices accordion */}
        {unselectedInvoices.length > 0 && (
          <Box>
            <Button
              fullWidth
              onClick={() => setAddMoreOpen(!addMoreOpen)}
              endIcon={addMoreOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{
                justifyContent: 'space-between',
                textTransform: 'none',
                px: 2,
                py: 1.25,
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" fontWeight={600}>
                  Other Invoices Awaiting Review
                </Typography>
                <Chip
                  label={unselectedInvoices.length}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22 }}
                />
              </Stack>
            </Button>

            <Collapse in={addMoreOpen}>
              <Paper
                variant="outlined"
                sx={{ mt: 0.5, borderRadius: 1.5, overflow: 'hidden' }}
              >
                {unselectedInvoices.map(inv => (
                  <InvoiceRow
                    key={inv.id}
                    invoice={inv}
                    selected={false}
                    onToggle={() => toggleInvoice(inv.id)}
                  />
                ))}
              </Paper>
            </Collapse>
          </Box>
        )}

        {/* ── Add to Payment Request section ── */}
        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden',
            mt: 2.5,
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: 'grey.50',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              Add to Payment Request
            </Typography>
          </Box>

          <Box sx={{ p: 2 }}>
            <RadioGroup
              value={effectiveSelected}
              onChange={(e) => setSelectedPRId(e.target.value)}
            >
              {prOptions.map(opt => (
                <FormControlLabel
                  key={opt.id}
                  value={opt.id}
                  control={<Radio size="small" />}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600}>{opt.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {opt.sublabel}
                        </Typography>
                      </Box>
                      {opt.statusLabel && (
                        <Chip
                          label={opt.statusLabel}
                          size="small"
                          color={opt.statusColor}
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                        />
                      )}
                    </Stack>
                  }
                  sx={{
                    mx: 0,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 1,
                    border: 1,
                    borderColor: effectiveSelected === opt.id ? 'primary.main' : 'divider',
                    bgcolor: effectiveSelected === opt.id ? (t) => alpha(t.palette.primary.main, 0.04) : 'transparent',
                    mb: 0.75,
                    '&:last-of-type': { mb: 0 },
                    '&:hover': { bgcolor: 'action.hover' },
                    '& .MuiFormControlLabel-label': { flex: 1, minWidth: 0 },
                  }}
                />
              ))}
            </RadioGroup>
          </Box>
        </Box>
      </Box>

      {/* Footer summary */}
      <Divider />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 1.5,
          bgcolor: 'grey.50',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {selectedIds.size} invoice{selectedIds.size !== 1 ? 's' : ''} selected
        </Typography>
        <Typography variant="subtitle2" fontWeight={700}>
          Total: {fmtCurrency(selectedTotal)}
        </Typography>
      </Box>
    </Box>
  );
}
