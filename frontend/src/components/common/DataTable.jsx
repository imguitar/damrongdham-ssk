import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '../../utils/constants';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

/**
 * columns: [{ id|key, label, minWidth|width, align, render(row) }]
 * rows: array of data objects
 * pagination props: total, page (0-based), rowsPerPage, onPageChange, onRowsPerPageChange
 * onRowClick(row): optional row click handler
 */
const DataTable = ({
  columns = [],
  rows = [],
  loading = false,
  total = 0,
  page = 0,
  rowsPerPage = DEFAULT_PAGE_SIZE,
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
  stickyHeader = true,
  emptyTitle,
  emptyDescription,
  emptyText,
  sx = {},
}) => {
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', ...sx }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader={stickyHeader} size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => {
                const colKey = col.id || col.key;
                return (
                  <TableCell
                    key={colKey}
                    align={col.align || 'left'}
                    style={{ minWidth: col.minWidth || col.width }}
                  >
                    {col.label}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ border: 0 }}>
                  <LoadingSpinner />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ border: 0 }}>
                  <EmptyState title={emptyTitle || emptyText} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow
                  hover
                  key={row.id ?? idx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={onRowClick ? { cursor: 'pointer' } : {}}
                >
                  {columns.map((col) => {
                    const colKey = col.id || col.key;
                    return (
                      <TableCell key={colKey} align={col.align || 'left'}>
                        {col.render ? col.render(row) : row[colKey] ?? '-'}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {onPageChange && (
        <TablePagination
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={onRowsPerPageChange ? (e) => onRowsPerPageChange(parseInt(e.target.value, 10)) : undefined}
          labelRowsPerPage="แถวต่อหน้า:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
          }
        />
      )}
    </Paper>
  );
};

export default DataTable;
