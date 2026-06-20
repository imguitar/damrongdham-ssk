import { useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';

// Max 10 MB per file
const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip';

const FileUpload = ({
  files = [],
  onAdd,
  onRemove,
  onDownload,
  readOnly = false,
  maxFiles = 10,
}) => {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter((f) => {
      if (f.size > MAX_SIZE) {
        alert(`ไฟล์ "${f.name}" มีขนาดเกิน 10 MB`);
        return false;
      }
      return true;
    });
    if (valid.length) onAdd?.(valid);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <Box>
      {!readOnly && files.length < maxFiles && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            hidden
            onChange={handleFileChange}
          />
          <Button
            variant="outlined"
            startIcon={<AttachFileIcon />}
            onClick={() => inputRef.current?.click()}
            size="small"
          >
            แนบไฟล์ (สูงสุด {maxFiles} ไฟล์, ไฟล์ละ ≤10 MB)
          </Button>
        </>
      )}

      {files.length > 0 && (
        <List dense sx={{ mt: 1 }}>
          {files.map((file, idx) => (
            <ListItem
              key={file.id || file.name || idx}
              sx={{ px: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 0.5 }}
              secondaryAction={
                <Box display="flex" gap={0.5}>
                  {onDownload && file.id && (
                    <IconButton size="small" onClick={() => onDownload(file)}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  )}
                  {!readOnly && onRemove && (
                    <IconButton size="small" color="error" onClick={() => onRemove(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              }
            >
              <ListItemText
                primary={file.original_name || file.name}
                secondary={formatSize(file.file_size || file.size)}
                primaryTypographyProps={{ variant: 'body2', noWrap: true, maxWidth: 300 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          ))}
        </List>
      )}

      {!readOnly && (
        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
          รองรับ: รูปภาพ, PDF, Word, Excel, ZIP
        </Typography>
      )}
    </Box>
  );
};

export default FileUpload;
