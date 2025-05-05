import React, { useState } from 'react';
import { Box, Button, TextField, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Paper, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

interface CategoryManagementProps {
  categories: string[];
  onAddCategory: (category: string) => Promise<void>;
  onEditCategory: (oldName: string, newName: string) => Promise<void>;
  onDeleteCategory: (category: string) => Promise<void>;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory
}) => {
  const [newCategory, setNewCategory] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState({ old: '', new: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    if (categories.includes(newCategory.trim())) {
      setError('Category already exists');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await onAddCategory(newCategory.trim());
      setNewCategory('');
    } catch (err) {
      setError('Failed to add category');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDialogOpen = (category: string) => {
    setEditCategory({ old: category, new: category });
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditCategory({ old: '', new: '' });
    setError('');
  };

  const handleEditCategory = async () => {
    if (!editCategory.new.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    if (
      editCategory.old !== editCategory.new &&
      categories.includes(editCategory.new.trim())
    ) {
      setError('Category already exists');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await onEditCategory(editCategory.old, editCategory.new.trim());
      handleEditDialogClose();
    } catch (err) {
      setError('Failed to update category');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDialogOpen = (category: string) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setCategoryToDelete('');
  };

  const handleDeleteCategory = async () => {
    setIsSubmitting(true);
    try {
      await onDeleteCategory(categoryToDelete);
      handleDeleteDialogClose();
    } catch (err) {
      console.error(err);
      setError('Failed to delete category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Category Management
      </Typography>

      <Box sx={{ display: 'flex', mb: 2 }}>
        <TextField
          fullWidth
          label="New Category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          error={!!error && !editDialogOpen}
          helperText={!editDialogOpen ? error : ''}
          sx={{ mr: 1 }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCategory}
          disabled={isSubmitting}
        >
          Add
        </Button>
      </Box>

      <List>
        {categories.map((category) => (
          <ListItem
            key={category}
            secondaryAction={
              <Box>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={() => handleEditDialogOpen(category)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeleteDialogOpen(category)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            }
          >
            <ListItemText primary={category} />
          </ListItem>
        ))}
      </List>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            type="text"
            fullWidth
            value={editCategory.new}
            onChange={(e) =>
              setEditCategory({ ...editCategory, new: e.target.value })
            }
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleEditCategory} disabled={isSubmitting} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the category "{categoryToDelete}"?
          </Typography>
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            Warning: This will not remove the category from existing products.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteCategory}
            color="error"
            disabled={isSubmitting}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CategoryManagement; 