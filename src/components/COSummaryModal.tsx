import { useRef, useCallback, useState } from 'react';
import {
  Modal,
  Paper,
  Box,
  Typography,
  Button,
  TextField,
  Stack,
  IconButton,
  Chip,
  Divider,
  Collapse,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAllocation } from '../AllocationContext';
import type { CODocument } from '../AllocationContext';

const CONTRACTOR_FEE_RATE = 0.15; // 15%
const LW_FEE_RATE = 0.004; // 0.4%

const fmtCurrency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function COSummaryModal() {
  const {
    showCOSummaryModal,
    setShowCOSummaryModal,
    setShowCompletionModal,
    pendingChangeOrders,
    sessionCONumber,
    categories,
    coSummaryTitle,
    setCOSummaryTitle,
    coSummaryDescription,
    setCOSummaryDescription,
    coSummaryDocuments,
    addCOSummaryDocument,
    removeCOSummaryDocument,
  } = useAllocation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lineItemsExpanded, setLineItemsExpanded] = useState(true);

  const lineItemSubtotal = pendingChangeOrders.reduce((sum, co) => sum + co.amount, 0);

  // Fee calculations (cascading: contractor on subtotal, LW on subtotal + contractor)
  const contractorFee = Math.round(lineItemSubtotal * CONTRACTOR_FEE_RATE * 100) / 100;
  const lwFee = Math.round((lineItemSubtotal + contractorFee) * LW_FEE_RATE * 100) / 100;
  const netImpact = lineItemSubtotal + contractorFee + lwFee;

  // Build line item summary cards — group by lineItemId and show per-invoice details
  const lineItemSummaries = (() => {
    const map = new Map<string, {
      lineItemId: string;
      lineItemDescription: string;
      lineItemNumber: string;
      categoryName: string;
      budgeted: number;
      newBudget: number;
      delta: number;
      invoices: { invoiceNumber: string; vendorName: string; amount: number; reason: string }[];
    }>();

    for (const co of pendingChangeOrders) {
      // Find line item details from categories
      let lineDesc = '';
      let lineNum = '';
      let catName = '';
      let budgeted = 0;

      for (const cat of categories) {
        const li = cat.lineItems.find(l => l.id === co.lineItemId);
        if (li) {
          lineDesc = li.description;
          lineNum = li.number;
          catName = cat.name;
          budgeted = li.budgeted;
          break;
        }
      }

      const existing = map.get(co.lineItemId);
      if (existing) {
        existing.delta += co.amount;
        existing.newBudget += co.amount;
        existing.invoices.push({
          invoiceNumber: co.invoiceNumber,
          vendorName: co.vendorName,
          amount: co.amount,
          reason: co.reason,
        });
      } else {
        map.set(co.lineItemId, {
          lineItemId: co.lineItemId,
          lineItemDescription: lineDesc,
          lineItemNumber: lineNum,
          categoryName: catName,
          budgeted,
          newBudget: budgeted + co.amount,
          delta: co.amount,
          invoices: [{
            invoiceNumber: co.invoiceNumber,
            vendorName: co.vendorName,
            amount: co.amount,
            reason: co.reason,
          }],
        });
      }
    }

    return Array.from(map.values());
  })();

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    const newDocs: CODocument[] = Array.from(files).map((file) => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    }));
    newDocs.forEach(d => addCOSummaryDocument(d));
  }, [addCOSummaryDocument]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect],
  );

  const handleConfirm = () => {
    setShowCOSummaryModal(false);
    setShowCompletionModal(true);
  };

  const handleClose = () => {
    setShowCOSummaryModal(false);
  };

  if (pendingChangeOrders.length === 0) return null;

  return (
    <Modal
      open={showCOSummaryModal}
      onClose={handleClose}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Paper
        sx={{
          width: '100%',
          maxWidth: 560,
          mx: 2,
          borderRadius: 0,
          outline: 'none',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'grey.200',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Budget Adjustment in This Request
            </Typography>
            <Chip
              label={sessionCONumber}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: 'grey.100',
                color: 'text.secondary',
              }}
            />
          </Box>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Scrollable content */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2.5 }}>
          {/* Title */}
          <TextField
            label="Title"
            size="small"
            fullWidth
            value={coSummaryTitle}
            onChange={(e) => setCOSummaryTitle(e.target.value)}
            placeholder="e.g. Concrete & HVAC Overages"
            sx={{ mb: 2 }}
          />

          {/* Description */}
          <TextField
            label="Description"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={coSummaryDescription}
            onChange={(e) => setCOSummaryDescription(e.target.value)}
            placeholder="Budget adjustments for over-budget allocations in this payment request."
            sx={{ mb: 2.5 }}
          />

          {/* Line items accordion */}
          <Button
            size="small"
            onClick={() => setLineItemsExpanded((prev) => !prev)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 0,
              mb: lineItemsExpanded ? 1.5 : 2.5,
              color: 'text.primary',
              '&:hover': { bgcolor: 'transparent' },
              gap: 0.5,
            }}
            disableRipple
          >
            {lineItemsExpanded
              ? <ExpandMoreIcon sx={{ fontSize: 20 }} />
              : <ChevronRightIcon sx={{ fontSize: 20 }} />
            }
            <Typography variant="subtitle2" fontWeight={600}>
              Line Items
            </Typography>
            <Box
              component="span"
              sx={{
                ml: 0.75,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontSize: '0.7rem',
                fontWeight: 700,
                height: 20,
                minWidth: 20,
                px: 0.5,
                borderRadius: '4px',
              }}
            >
              {lineItemSummaries.length}
            </Box>
          </Button>

          <Collapse in={lineItemsExpanded}>
            <Stack spacing={1.5} sx={{ mb: 2.5 }}>
              {lineItemSummaries.map((item) => (
                <Box
                  key={item.lineItemId}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'grey.50',
                  }}
                >
                  {/* Line number + category · description */}
                  <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ mb: 0.75 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ flexShrink: 0 }}>
                      {item.lineItemNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {item.categoryName} &middot; {item.lineItemDescription}
                    </Typography>
                  </Stack>

                  {/* Previous / New amounts */}
                  <Stack direction="row" spacing={2} alignItems="flex-end">
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                        Previous
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {fmtCurrency(item.budgeted)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                        New
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {fmtCurrency(item.newBudget)}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={item.delta >= 0 ? 'error.main' : 'success.main'}
                    >
                      ({item.delta >= 0 ? '+' : ''}{fmtCurrency(item.delta)})
                    </Typography>
                  </Stack>

                  {/* Per-invoice reasons */}
                  {item.invoices.map((inv, idx) => (
                    <Typography
                      key={idx}
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      Reason: {inv.reason}
                      {item.invoices.length > 1 && (
                        <> ({inv.invoiceNumber} &middot; {inv.vendorName})</>
                      )}
                    </Typography>
                  ))}
                </Box>
              ))}
            </Stack>
          </Collapse>

          {/* Cost Breakdown */}
          <Box
            sx={{
              p: 1.5,
              bgcolor: 'grey.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              mb: 2.5,
            }}
          >
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Cost Breakdown
            </Typography>
            <Stack spacing={0.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Budget Changes
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {lineItemSubtotal >= 0 ? '+' : ''}{fmtCurrency(lineItemSubtotal)}
                </Typography>
              </Stack>
              {contractorFee !== 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Contractor Fee (15%)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {contractorFee >= 0 ? '+' : ''}{fmtCurrency(contractorFee)}
                  </Typography>
                </Stack>
              )}
              {lwFee !== 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    LedgerWise Trust Account Fee (0.4%)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {lwFee >= 0 ? '+' : ''}{fmtCurrency(lwFee)}
                  </Typography>
                </Stack>
              )}
              <Divider sx={{ my: 0.5 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontWeight={700}>
                  Net Impact
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color={netImpact >= 0 ? 'error.main' : 'success.main'}
                >
                  {netImpact >= 0 ? '+' : ''}{fmtCurrency(netImpact)}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {/* Documents section */}
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Documents
          </Typography>

          {/* Drop zone */}
          <Box
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              py: 2,
              px: 2,
              textAlign: 'center',
              borderRadius: 0,
              border: '1px dashed',
              borderColor: 'grey.300',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background-color 0.15s',
              '&:hover': {
                borderColor: 'info.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 24, color: 'text.disabled', mb: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              Drop files here or click to browse
            </Typography>
            <Typography variant="caption" color="text.disabled">
              PDF, images, or documents up to 25 MB
            </Typography>
          </Box>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          {/* Attached files */}
          {coSummaryDocuments.length > 0 && (
            <Stack spacing={0.5} sx={{ mt: 1.5 }}>
              {coSummaryDocuments.map((doc) => (
                <Stack
                  key={doc.id}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 0,
                    bgcolor: 'grey.50',
                  }}
                >
                  <InsertDriveFileIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                  <Typography variant="body2" sx={{ flex: 1 }} noWrap>
                    {doc.name}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {formatSize(doc.size)}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); removeCOSummaryDocument(doc.id); }}
                    sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' }, p: 0.25 }}
                  >
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5,
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'grey.200',
            flexShrink: 0,
          }}
        >
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleClose}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Confirm & Add to PR
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
}
