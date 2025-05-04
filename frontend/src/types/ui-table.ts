/**
 * Table component type definitions.
 */

/**
 * Table column definition
 */
export interface TableColumn<T> {
  id: string;
  header: string | React.ReactNode;
  accessor: keyof T | ((row: T) => any);
  cell?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: number | string;
}

/**
 * Table component props
 */
export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  isSelectable?: boolean;
  selectedRows?: T[];
  onSelectedRowsChange?: (rows: T[]) => void;
  sortable?: boolean;
  initialSortBy?: string;
  initialSortDirection?: 'asc' | 'desc';
} 