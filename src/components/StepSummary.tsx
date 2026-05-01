import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
  Chip,
  Collapse,
  alpha,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useAllocation } from '../AllocationContext';
import type { BudgetCategory } from '../types';

function fmtCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface CategoryImpact {
  id: string;
  number: string;
  name: string;
  budgeted: number;
  priorDraws: number;
  thisBatch: number;
  remaining: number;
}

function computeBudgetImpact(categories: BudgetCategory[]): CategoryImpact[] {
  return categories
    .map(cat => {
      let budgeted = 0, priorDraws = 0, thisBatch = 0;
      for (const li of cat.lineItems) {
        budgeted += li.budgeted;
        priorDraws += li.priorDraws;
        thisBatch += li.allocations.reduce((s, a) => s + a.amount, 0);
      }
      return {
        id: cat.id,
        number: cat.number,
        name: cat.name,
        budgeted,
        priorDraws,
        thisBatch,
        remaining: budgeted - priorDraws - thisBatch,
      };
    })
    .filter(c => c.thisBatch > 0);
}

function getInvoiceAllocationSummary(
  invoiceId: string,
  categories: BudgetCategory[]
): { lineItemDesc: string; amount: number }[] {
  const result: { lineItemDesc: string; amount: number }[] = [];
  for (const cat of categories) {
    for (const li of cat.lineItems) {
      for (const a of li.allocations) {
        if (a.invoiceId === invoiceId) {
          const existing = result.find(r => r.lineItemDesc === li.description);
          if (existing) existing.amount += a.amount;
          else result.push({ lineItemDesc: li.description, amount: a.amount });
        }
      }
    }
  }
  return result;
}

export default function StepSummary() {
  const {
    selectedInvoices,
    selectedTotal,
    categories,
    draftPRs,
    selectedPRId,
    setSelectedPRId,
    totalBudgeted,
  } = useAllocation();

  const [summaryOpen, setSummaryOpen] = useState(true);

  const budgetImpact = useMemo(() => computeBudgetImpact(categories), [categories]);

  const totalThisBatch = useMemo(
    () => budgetImpact.reduce((s, c) => s + c.thisBatch, 0),
    [budgetImpact]
  );

  const totalRemaining = useMemo(
    () => budgetImpact.reduce((s, c) => s + c.remaining, 0),
    [budgetImpact]
  );

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

        {/* ── Section 1: Add to Payment Request (top card) ── */}
        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 0,
            overflow: 'hidden',
            mb: 2.5,
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
                    borderRadius: 0,
                    border: 1,
                    borderColor: effectiveSelected === opt.id ? 'info.main' : 'divider',
                    bgcolor: effectiveSelected === opt.id ? (t) => alpha(t.palette.info.main, 0.04) : 'transparent',
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

        {/* ── Section 2: Approval Summary (accordion, open by default) ── */}
        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 0,
            overflow: 'hidden',
          }}
        >
          <Box
            onClick={() => setSummaryOpen(prev => !prev)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              bgcolor: 'grey.50',
              borderBottom: summaryOpen ? 1 : 0,
              borderColor: 'divider',
              cursor: 'pointer',
              userSelect: 'none',
              '&:hover': { bgcolor: 'grey.100' },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle2" fontWeight={700}>
                Approval Summary
              </Typography>
              <Chip
                label={`${selectedInvoices.length} invoices · ${fmtCurrency(selectedTotal)}`}
                size="small"
                sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
              />
            </Stack>
            {summaryOpen ? (
              <ExpandLessIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            ) : (
              <ExpandMoreIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            )}
          </Box>

          <Collapse in={summaryOpen}>
            <Box sx={{ p: 2 }}>
              {/* Approved Invoices */}
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Included Invoices
              </Typography>
              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 0,
                  overflow: 'hidden',
                  mb: 2.5,
                }}
              >
                {selectedInvoices.map((inv, idx) => {
                  const allocSummary = getInvoiceAllocationSummary(inv.id, categories);
                  return (
                    <Box
                      key={inv.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 2,
                        py: 1,
                        borderBottom: idx < selectedInvoices.length - 1 ? 1 : 0,
                        borderColor: 'divider',
                      }}
                    >
                      <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {inv.vendorName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {allocSummary.length > 0
                            ? allocSummary.map(a => a.lineItemDesc).join(', ')
                            : 'No allocation'}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700} sx={{ flexShrink: 0 }}>
                        {fmtCurrency(inv.amount)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Budget Impact */}
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Budget Impact
              </Typography>
              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 0,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 90px 90px 90px',
                    px: 2,
                    py: 0.75,
                    bgcolor: 'grey.100',
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color="text.secondary">Category</Typography>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textAlign: 'right' }}>Budgeted</Typography>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textAlign: 'right' }}>This Batch</Typography>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textAlign: 'right' }}>Remaining</Typography>
                </Box>

                {budgetImpact.map((cat, idx) => (
                  <Box
                    key={cat.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 90px 90px 90px',
                      px: 2,
                      py: 0.75,
                      borderBottom: idx < budgetImpact.length - 1 ? 1 : 0,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2" noWrap>
                      {cat.number} {cat.name}
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: 'right' }}>
                      {fmt(cat.budgeted)}
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: 'right', color: 'info.main', fontWeight: 600 }}>
                      {fmt(cat.thisBatch)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: 'right',
                        color: cat.remaining < 0 ? 'error.main' : 'text.primary',
                      }}
                    >
                      {fmt(cat.remaining)}
                    </Typography>
                  </Box>
                ))}

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 90px 90px 90px',
                    px: 2,
                    py: 1,
                    bgcolor: 'grey.50',
                    borderTop: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2" fontWeight={700}>Total</Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ textAlign: 'right' }}>
                    {fmt(totalBudgeted)}
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ textAlign: 'right', color: 'info.main' }}>
                    {fmt(totalThisBatch)}
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ textAlign: 'right' }}>
                    {fmt(totalRemaining)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Collapse>
        </Box>
      </Box>

      {/* Footer */}
      <Divider />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 1.5,
          bgcolor: (t) => alpha(t.palette.success.main, 0.04),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
          <Typography variant="body2" color="text.secondary">
            {selectedInvoices.length} invoice{selectedInvoices.length !== 1 ? 's' : ''} ready
          </Typography>
        </Stack>
        <Typography variant="subtitle2" fontWeight={700}>
          {fmtCurrency(selectedTotal)}
        </Typography>
      </Box>
    </Box>
  );
}
