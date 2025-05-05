import React, { useState, useEffect } from 'react';
import { Product } from '../../types/models';
import { createProduct, updateProduct } from '../../services/product-service';
import { TextField, Button, FormControl, InputLabel, Select, MenuItem, FormHelperText, Switch, FormControlLabel, Grid, Paper, Typography, Box } from '@mui/material';

interface ProductFormProps {
  product?: Product;
  onSave: (savedProduct: Product) => void;
  onCancel: () => void;
  categories: string[];
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel, categories }) => {
  const isEditing = !!product;
  const [formData, setFormData] = useState<Partial<Product>>(
    product || {
      name: '',
      description: '',
      price: 0,
      currency: 'SEK',
      inventoryCount: 0,
      sku: '',
      categoryId: '',
      imageUrls: [],
      isActive: true,
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({
        ...formData,
        [name]: value,
      });
      // Clear error for this field if exists
      if (errors[name]) {
        const newErrors = { ...errors };
        delete newErrors[name];
        setErrors(newErrors);
      }
    }
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (formData.price === undefined || formData.price < 0) {
      newErrors.price = 'Price must be a positive number';
    }

    if (formData.inventoryCount === undefined || formData.inventoryCount < 0) {
      newErrors.inventoryCount = 'Inventory count must be a non-negative number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      let savedProduct;
      if (isEditing && product?.id) {
        savedProduct = await updateProduct(product.id, formData);
      } else {
        savedProduct = await createProduct(formData as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
      }
      onSave(savedProduct);
    } catch (error) {
      console.error('Error saving product:', error);
      setErrors({ 
        submit: 'Failed to save product. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {isEditing ? 'Edit Product' : 'Add New Product'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Product Name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="SKU"
              name="sku"
              value={formData.sku || ''}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Price"
              name="price"
              type="number"
              value={formData.price || ''}
              onChange={handleChange}
              error={!!errors.price}
              helperText={errors.price}
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Currency"
              name="currency"
              value={formData.currency || 'SEK'}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Inventory Count"
              name="inventoryCount"
              type="number"
              value={formData.inventoryCount || 0}
              onChange={handleChange}
              error={!!errors.inventoryCount}
              helperText={errors.inventoryCount}
              InputProps={{ inputProps: { min: 0, step: 1 } }}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                name="categoryId"
                value={formData.categoryId || ''}
                label="Category"
                onChange={handleChange}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              multiline
              rows={4}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Image URLs (comma separated)"
              name="imageUrls"
              value={Array.isArray(formData.imageUrls) ? formData.imageUrls.join(', ') : ''}
              onChange={(e) => {
                const urls = e.target.value.split(',').map(url => url.trim()).filter(url => url);
                setFormData({
                  ...formData,
                  imageUrls: urls,
                });
              }}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive || false}
                  onChange={handleSwitchChange}
                  name="isActive"
                  color="primary"
                />
              }
              label="Active Product"
            />
          </Grid>

          {errors.submit && (
            <Grid item xs={12}>
              <FormHelperText error>{errors.submit}</FormHelperText>
            </Grid>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default ProductForm; 