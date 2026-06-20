import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

const FilterBar = ({ filters, onChange, onSearch, onClear, fields = [] }) => {
  const handleChange = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box display="flex" flexWrap="wrap" gap={2} alignItems="flex-end">
        {fields.map((field) => {
          if (field.type === 'select') {
            return (
              <FormControl key={field.key} size="small" sx={{ minWidth: 160 }}>
                <InputLabel>{field.label}</InputLabel>
                <Select
                  value={filters[field.key] ?? ''}
                  label={field.label}
                  onChange={handleChange(field.key)}
                >
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  {(field.options || []).map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          }
          return (
            <TextField
              key={field.key}
              label={field.label}
              size="small"
              value={filters[field.key] ?? ''}
              onChange={handleChange(field.key)}
              sx={{ minWidth: 200 }}
              onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
            />
          );
        })}

        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={onSearch}
          sx={{ height: 40 }}
        >
          ค้นหา
        </Button>
        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={onClear}
          sx={{ height: 40 }}
        >
          ล้าง
        </Button>
      </Box>
    </Paper>
  );
};

export default FilterBar;
