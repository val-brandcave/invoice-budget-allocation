import { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Collapse,
  IconButton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useAllocation } from '../AllocationContext';
import { getInvoiceStatus, getInvoiceProgress } from '../types';
import InvoiceCard from './InvoiceCard';

export default function InvoicePanel() {
  const { invoices, categories } = useAllocation();
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  // Split invoices by allocation status
  const pending = invoices.filter(inv => getInvoiceStatus(inv, categories) !== 'fully_allocated');
  const completed = invoices.filter(inv => getInvoiceStatus(inv, categories) === 'fully_allocated');
  const totalAllocated = completed.length;

  return (
    <Box
      sx={{
        flex: '1 1 38%',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'grey.50',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">{invoices.length} Invoices</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Chip
            label={`${pending.length} remaining`}
            size="small"
            sx={{ bgcolor: pending.length > 0 ? 'warning.lighter' : 'success.lighter', fontWeight: 500, fontSize: '0.75rem' }}
          />
          <Chip
            label={`${totalAllocated} done`}
            size="small"
            sx={{ bgcolor: 'success.lighter', color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}
          />
        </Box>
      </Box>

      {/* Scrollable Invoice List */}
      <Box
        sx={{
          flex: pdfOpen ? '0 0 35%' : 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: 1.5,
          py: 1.5,
          '& > *': { mb: 1.5 },
          '& > *:last-child': { mb: 0 },
        }}
      >
        {/* Pending invoices */}
        {pending.map(inv => (
          <InvoiceCard
            key={inv.id}
            invoice={inv}
            categories={categories}
            isActive={activeInvoiceId === inv.id}
            onSelect={() => setActiveInvoiceId(inv.id)}
          />
        ))}

        {/* Completed section */}
        {completed.length > 0 && (
          <>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mt: 1 }}>
              FULLY ALLOCATED ({completed.length})
            </Typography>
            {completed.map(inv => (
              <InvoiceCard
                key={inv.id}
                invoice={inv}
                categories={categories}
                isActive={activeInvoiceId === inv.id}
                onSelect={() => setActiveInvoiceId(inv.id)}
              />
            ))}
          </>
        )}
      </Box>

      {/* PDF Viewer Toggle Button */}
      {!pdfOpen && (
        <Box
          sx={{
            px: 2,
            py: 1,
            borderTop: '1px solid',
            borderColor: 'grey.200',
            bgcolor: 'background.paper',
            flexShrink: 0,
          }}
        >
          <Button
            fullWidth
            startIcon={<VisibilityIcon />}
            onClick={() => setPdfOpen(true)}
            variant="outlined"
            size="small"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            Review Invoice PDF
          </Button>
        </Box>
      )}

      {/* PDF Viewer Panel */}
      <Collapse in={pdfOpen}>
        <Box
          sx={{
            height: '55vh',
            borderTop: '2px solid',
            borderColor: 'grey.300',
            bgcolor: 'grey.100',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* PDF toolbar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 1.5,
              py: 0.75,
              borderBottom: '1px solid',
              borderColor: 'grey.200',
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="caption" fontWeight={600}>
              {activeInvoiceId
                ? invoices.find(i => i.id === activeInvoiceId)?.invoiceNumber ?? 'Select an invoice'
                : 'Select an invoice'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton size="small"><NavigateBeforeIcon fontSize="small" /></IconButton>
              <Typography variant="caption">1 / 6</Typography>
              <IconButton size="small"><NavigateNextIcon fontSize="small" /></IconButton>
              <IconButton size="small"><ZoomOutIcon fontSize="small" /></IconButton>
              <IconButton size="small"><ZoomInIcon fontSize="small" /></IconButton>
            </Box>
            <Button
              size="small"
              startIcon={<KeyboardArrowDownIcon />}
              onClick={() => setPdfOpen(false)}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              Close
            </Button>
          </Box>

          {/* Mock PDF Content */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              m: 1.5,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200',
              boxShadow: 1,
            }}
          >
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                INVOICE #{activeInvoiceId ? invoices.find(i => i.id === activeInvoiceId)?.invoiceNumber : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {activeInvoiceId ? invoices.find(i => i.id === activeInvoiceId)?.vendorName : 'Select an invoice to preview'}
              </Typography>
              <Box sx={{ width: 280, mx: 'auto' }}>
                {/* Mock invoice lines */}
                {activeInvoiceId && invoices.find(i => i.id === activeInvoiceId)?.subItems.map((si, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px dashed', borderColor: 'grey.200' }}>
                    <Typography variant="caption" color="text.secondary">{si.description}</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      ${si.amount.toLocaleString()}
                    </Typography>
                  </Box>
                ))}
                {activeInvoiceId && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, mt: 0.5 }}>
                    <Typography variant="caption" fontWeight={700}>TOTAL</Typography>
                    <Typography variant="caption" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      ${invoices.find(i => i.id === activeInvoiceId)?.amount.toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography variant="caption" color="grey.400" sx={{ display: 'block', mt: 3 }}>
                (Mock PDF — actual PDF rendering not in prototype scope)
              </Typography>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
