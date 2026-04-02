import { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Collapse,
  IconButton,
  SwipeableDrawer,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useAllocation } from '../AllocationContext';
import { getInvoiceStatus } from '../types';
import InvoiceCard from './InvoiceCard';

// Shared mock PDF content
function PdfContent({
  activeInvoiceId,
  invoices,
  isMobile,
}: {
  activeInvoiceId: string | null;
  invoices: ReturnType<typeof useAllocation>['invoices'];
  isMobile: boolean;
}) {
  const activeInvoice = activeInvoiceId ? invoices.find(i => i.id === activeInvoiceId) : null;

  return (
    <Box sx={{ textAlign: 'center', p: isMobile ? 3 : 4 }}>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
        INVOICE #{activeInvoice?.invoiceNumber ?? '—'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {activeInvoice?.vendorName ?? 'Select an invoice to preview'}
      </Typography>
      <Box sx={{ width: 280, mx: 'auto' }}>
        {activeInvoice?.subItems.map((si, idx) => (
          <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px dashed', borderColor: 'grey.200' }}>
            <Typography variant="caption" color="text.secondary">{si.description}</Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
              ${si.amount.toLocaleString()}
            </Typography>
          </Box>
        ))}
        {activeInvoice && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, mt: 0.5 }}>
            <Typography variant="caption" fontWeight={700}>TOTAL</Typography>
            <Typography variant="caption" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
              ${activeInvoice.amount.toLocaleString()}
            </Typography>
          </Box>
        )}
      </Box>
      <Typography variant="caption" color="grey.400" sx={{ display: 'block', mt: 3 }}>
        (Mock PDF — actual PDF rendering not in prototype scope)
      </Typography>
    </Box>
  );
}

export default function InvoicePanel({ isMobile = false }: { isMobile?: boolean }) {
  const { invoices, categories, totalThisDraw } = useAllocation();
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  const pending = invoices.filter(inv => getInvoiceStatus(inv, categories) !== 'fully_allocated');
  const completed = invoices.filter(inv => getInvoiceStatus(inv, categories) === 'fully_allocated');
  const totalAllocated = completed.length;

  return (
    <Box
      sx={{
        flex: isMobile ? 1 : '1 1 40%',
        minWidth: isMobile ? 0 : 340,
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? 'auto' : '100vh',
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: 'grey.50',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: isMobile ? 2 : 1.5,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'background.paper',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant={isMobile ? 'h5' : 'h6'} fontWeight={700}>
              {invoices.length} Invoices
            </Typography>
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

        {/* Mobile: show draw total inline since no budget table */}
        {isMobile && totalThisDraw > 0 && (
          <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ mt: 0.5, display: 'block' }}>
            This Draw: {totalThisDraw.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}
          </Typography>
        )}
      </Box>

      {/* Scrollable Invoice List */}
      <Box
        sx={{
          flex: (!isMobile && pdfOpen) ? '0 0 35%' : 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: isMobile ? 2 : 1.5,
          py: 1.5,
          '& > *': { mb: 1.5 },
          '& > *:last-child': { mb: 0 },
        }}
      >
        {pending.map(inv => (
          <InvoiceCard
            key={inv.id}
            invoice={inv}
            categories={categories}
            isActive={activeInvoiceId === inv.id}
            onSelect={() => setActiveInvoiceId(inv.id)}
            isMobile={isMobile}
          />
        ))}

        {completed.length > 0 && (
          <>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              FULLY ALLOCATED ({completed.length})
            </Typography>
            {completed.map(inv => (
              <InvoiceCard
                key={inv.id}
                invoice={inv}
                categories={categories}
                isActive={activeInvoiceId === inv.id}
                onSelect={() => setActiveInvoiceId(inv.id)}
                isMobile={isMobile}
              />
            ))}
          </>
        )}
      </Box>

      {/* PDF Viewer Toggle Button */}
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
          size={isMobile ? 'medium' : 'small'}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            minHeight: isMobile ? 44 : undefined,
          }}
        >
          Review Invoice PDF
        </Button>
      </Box>

      {/* PDF Viewer — Drawer on mobile, Collapse on desktop */}
      {isMobile ? (
        <SwipeableDrawer
          anchor="bottom"
          open={pdfOpen}
          onClose={() => setPdfOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen
          PaperProps={{
            sx: {
              height: '85vh',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          {/* Drag handle + toolbar */}
          <Box sx={{ px: 2, pt: 1, pb: 0.5, flexShrink: 0 }}>
            <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'grey.300', mx: 'auto', mb: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {activeInvoiceId
                  ? invoices.find(i => i.id === activeInvoiceId)?.invoiceNumber ?? 'Select an invoice'
                  : 'Select an invoice'}
              </Typography>
              <IconButton size="small" onClick={() => setPdfOpen(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <IconButton size="small"><NavigateBeforeIcon fontSize="small" /></IconButton>
              <Typography variant="caption">1 / 6</Typography>
              <IconButton size="small"><NavigateNextIcon fontSize="small" /></IconButton>
              <Box sx={{ flex: 1 }} />
              <IconButton size="small"><ZoomOutIcon fontSize="small" /></IconButton>
              <IconButton size="small"><ZoomInIcon fontSize="small" /></IconButton>
            </Box>
          </Box>

          {/* PDF content area */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              m: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200',
              boxShadow: 1,
              overflow: 'auto',
            }}
          >
            <PdfContent activeInvoiceId={activeInvoiceId} invoices={invoices} isMobile />
          </Box>
        </SwipeableDrawer>
      ) : (
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
              <PdfContent activeInvoiceId={activeInvoiceId} invoices={invoices} isMobile={false} />
            </Box>
          </Box>
        </Collapse>
      )}
    </Box>
  );
}
