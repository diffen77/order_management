import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Box, Typography, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Product } from '../../types/models';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, onEdit, onDelete }) => {
  if (products.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography variant="subtitle1" color="text.secondary">
          No products found.
        </Typography>
      </Box>
    );
  }

  const formatCurrency = (price: number, currency: string = 'SEK'): string => {
    return `${price.toFixed(2)} ${currency}`;
  };

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="product table">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell>Category</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="center">Stock</TableCell>
            <TableCell align="center">Status</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {product.name}
              </TableCell>
              <TableCell>{product.sku || '-'}</TableCell>
              <TableCell>{product.categoryId || '-'}</TableCell>
              <TableCell align="right">
                {formatCurrency(product.price)}
              </TableCell>
              <TableCell align="center">
                {product.inventoryCount}
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={product.isActive ? 'Active' : 'Inactive'}
                  color={product.isActive ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <IconButton
                    color="primary"
                    aria-label="edit product"
                    onClick={() => onEdit(product)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    aria-label="delete product"
                    onClick={() => onDelete(product)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProductTable; 