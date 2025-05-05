import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Button, TextField, InputAdornment, IconButton, CircularProgress, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ProductForm from '../../components/products/ProductForm';
import CategoryManagement from '../../components/products/CategoryManagement';
import ProductTable from '../../components/products/ProductTable';
import { Product } from '../../types/models';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/product-service';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../../services/category-service';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const ProductManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const result = await getProducts();
      setProducts(result.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      showSnackbar('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await getCategories();
      setCategories(result || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showSnackbar('Failed to load categories', 'error');
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddProduct = () => {
    setCurrentProduct(undefined);
    setShowProductForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setCurrentProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteConfirm = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      await deleteProduct(productToDelete.id);
      setProducts(products.filter(p => p.id !== productToDelete.id));
      showSnackbar('Product deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting product:', error);
      showSnackbar('Failed to delete product', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleSaveProduct = async (savedProduct: Product) => {
    try {
      const isNewProduct = !currentProduct;
      if (isNewProduct) {
        // If it's a new product, add it to the list
        setProducts([...products, savedProduct]);
      } else {
        // If it's an update, replace the old product
        setProducts(products.map(p => (p.id === savedProduct.id ? savedProduct : p)));
      }
      setShowProductForm(false);
      showSnackbar(`Product ${isNewProduct ? 'created' : 'updated'} successfully`, 'success');
    } catch (error) {
      console.error('Error saving product:', error);
      showSnackbar(`Failed to ${currentProduct ? 'update' : 'create'} product`, 'error');
    }
  };

  const handleAddCategoryClick = async (category: string) => {
    try {
      await addCategory(category);
      await fetchCategories(); // Refresh the categories list
      showSnackbar('Category added successfully', 'success');
    } catch (error) {
      console.error('Error adding category:', error);
      showSnackbar('Failed to add category', 'error');
      throw error; // Re-throw so the component can handle it
    }
  };

  const handleEditCategoryClick = async (oldName: string, newName: string) => {
    try {
      await updateCategory(oldName, newName);
      await fetchCategories(); // Refresh the categories list
      showSnackbar('Category updated successfully', 'success');
    } catch (error) {
      console.error('Error updating category:', error);
      showSnackbar('Failed to update category', 'error');
      throw error; // Re-throw so the component can handle it
    }
  };

  const handleDeleteCategoryClick = async (category: string) => {
    try {
      await deleteCategory(category);
      await fetchCategories(); // Refresh the categories list
      showSnackbar('Category deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting category:', error);
      showSnackbar('Failed to delete category', 'error');
      throw error; // Re-throw so the component can handle it
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Product Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="product management tabs">
          <Tab label="Products" id="product-tab-0" aria-controls="product-tabpanel-0" />
          <Tab label="Categories" id="product-tab-1" aria-controls="product-tabpanel-1" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddProduct}
          >
            Add Product
          </Button>
          <TextField
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ProductTable
            products={filteredProducts}
            onEdit={handleEditProduct}
            onDelete={handleDeleteConfirm}
          />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <CategoryManagement
          categories={categories}
          onAddCategory={handleAddCategoryClick}
          onEditCategory={handleEditCategoryClick}
          onDeleteCategory={handleDeleteCategoryClick}
        />
      </TabPanel>

      {/* Product Form Dialog */}
      <Dialog
        open={showProductForm}
        onClose={() => setShowProductForm(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{currentProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <ProductForm
            product={currentProduct}
            onSave={handleSaveProduct}
            onCancel={() => setShowProductForm(false)}
            categories={categories}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the product "{productToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteProduct} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductManagement; 