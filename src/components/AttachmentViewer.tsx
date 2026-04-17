import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import type { Attachment } from '../types';

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

function getFileIcon(fileType: Attachment['fileType']) {
  switch (fileType) {
    case 'pdf':
      return <PictureAsPdfIcon sx={{ fontSize: 14 }} />;
    case 'image':
      return <ImageIcon sx={{ fontSize: 14 }} />;
    default:
      return <AttachFileIcon sx={{ fontSize: 14 }} />;
  }
}

function truncateFileName(name: string, max = 18): string {
  if (name.length <= max) return name;
  const ext = name.lastIndexOf('.');
  if (ext > 0) {
    const base = name.slice(0, ext);
    const extension = name.slice(ext);
    const available = max - extension.length - 1; // -1 for the ellipsis character
    if (available > 3) {
      return base.slice(0, available) + '…' + extension;
    }
  }
  return name.slice(0, max - 1) + '…';
}

export default function AttachmentViewer({
  attachments,
  isMobile: _isMobile = false,
}: {
  attachments: Attachment[];
  isMobile?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pdfPage, setPdfPage] = useState(1);

  const active = attachments[activeIndex] ?? null;
  const isSingleFile = attachments.length === 1;
  const pageCount = active?.pageCount ?? 1;

  const handleChipClick = useCallback((index: number) => {
    setActiveIndex(index);
    setZoom(1);
    setPdfPage(1);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(MIN_ZOOM, z - ZOOM_STEP));
  }, []);

  const handleFit = useCallback(() => {
    setZoom(1);
  }, []);

  const handlePrevPage = useCallback(() => {
    setPdfPage(p => Math.max(1, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPdfPage(p => Math.min(pageCount, p + 1));
  }, [pageCount]);

  if (attachments.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          bgcolor: 'grey.50',
          borderRadius: 1,
        }}
      >
        <AttachFileIcon sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          No files attached
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'grey.200',
        boxShadow: 1,
        overflow: 'hidden',
      }}
    >
      {/* ── HEADER: section title + chip row ── */}
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'grey.50',
          flexShrink: 0,
        }}
      >
        <Typography
          variant="caption"
          fontWeight={600}
          color="text.secondary"
          sx={{ display: 'block', mb: isSingleFile ? 0 : 0.5 }}
        >
          {isSingleFile ? 'Attachment' : `Attachments (${attachments.length})`}
        </Typography>

        {/* Chip row — hidden for single file */}
        {!isSingleFile && (
          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              overflowX: 'auto',
              pb: 0.25,
              alignItems: 'center',
              // Fade edges for scroll hint
              maskImage: 'linear-gradient(to right, transparent 0, black 4px, black calc(100% - 4px), transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 4px, black calc(100% - 4px), transparent 100%)',
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
            }}
          >
            {attachments.map((att, idx) => (
              <Box key={att.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {/* Divider between invoice (idx 0) and supplemental attachments */}
                {idx === 1 && (
                  <Typography
                    component="span"
                    sx={{
                      color: 'grey.400',
                      fontSize: '0.9rem',
                      lineHeight: 1,
                      mx: 0.25,
                      userSelect: 'none',
                    }}
                  >
                    |
                  </Typography>
                )}
                <Chip
                  icon={getFileIcon(att.fileType)}
                  label={truncateFileName(att.fileName)}
                  size="small"
                  variant={idx === activeIndex ? 'filled' : 'outlined'}
                  color={idx === activeIndex ? 'primary' : 'default'}
                  onClick={() => handleChipClick(idx)}
                  sx={{
                    flexShrink: 0,
                    fontSize: '0.7rem',
                    height: 26,
                    cursor: 'pointer',
                    '& .MuiChip-icon': {
                      fontSize: 14,
                      ml: 0.5,
                    },
                    '& .MuiChip-label': {
                      px: 0.75,
                    },
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* ── VIEWER AREA ── */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: zoom === 1 ? 'flex-start' : 'flex-start',
          bgcolor: '#f5f5f5',
          position: 'relative',
        }}
      >
        {active && (
          <Box
            component="img"
            src={active.url}
            alt={active.fileName}
            sx={{
              width: zoom === 1 ? '100%' : undefined,
              maxWidth: zoom === 1 ? '100%' : undefined,
              height: 'auto',
              display: 'block',
              objectFit: 'contain',
              transform: zoom !== 1 ? `scale(${zoom})` : undefined,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
          />
        )}
      </Box>

      {/* ── CONTROLS BAR (adaptive) ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 0.25,
          borderTop: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'grey.50',
          flexShrink: 0,
          minHeight: 36,
        }}
      >
        {/* Left: Page nav (PDF with >1 page only) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, minWidth: 100 }}>
          {active?.fileType === 'pdf' && pageCount > 1 && (
            <>
              <IconButton size="small" onClick={handlePrevPage} disabled={pdfPage <= 1}>
                <NavigateBeforeIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 48, textAlign: 'center' }}>
                {pdfPage} / {pageCount}
              </Typography>
              <IconButton size="small" onClick={handleNextPage} disabled={pdfPage >= pageCount}>
                <NavigateNextIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </>
          )}
        </Box>

        {/* Right: Zoom controls (always) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <IconButton size="small" onClick={handleFit} title="Fit to width">
            <FitScreenIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= MIN_ZOOM}>
            <ZoomOutIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              minWidth: 36,
              textAlign: 'center',
              fontSize: '0.7rem',
            }}
          >
            {Math.round(zoom * 100)}%
          </Typography>
          <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= MAX_ZOOM}>
            <ZoomInIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
