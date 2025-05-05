import React, { useState, useEffect } from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Box,
  Typography,
  Paper,
  Chip,
  useTheme,
  Skeleton,
  IconButton,
  CircularProgress,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon,
  CreditCard as PaymentIcon,
  CheckCircle as DeliveredIcon,
  Cancel as CancelIcon,
  Assignment as ProcessingIcon,
  AssignmentReturn as ReturnIcon,
  AddComment as AddNoteIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import { OrderHistoryItem, OrderNote, addOrderNote } from '../services/order-service';

// Format date
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Map status to icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <InventoryIcon color="info" />;
    case 'processing':
      return <ProcessingIcon color="primary" />;
    case 'shipped':
      return <ShippingIcon color="primary" />;
    case 'delivered':
      return <DeliveredIcon color="success" />;
    case 'cancelled':
      return <CancelIcon color="error" />;
    case 'returned':
      return <ReturnIcon color="warning" />;
    default:
      return <ProcessingIcon />;
  }
};

// Map status to color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'info';
    case 'processing':
      return 'primary';
    case 'shipped':
      return 'primary';
    case 'delivered':
      return 'success';
    case 'cancelled':
      return 'error';
    case 'returned':
      return 'warning';
    default:
      return 'default';
  }
};

// Get status label
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'pending': 'Pending',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'returned': 'Returned'
  };
  
  return labels[status] || status;
};

interface OrderTimelineProps {
  orderId: string;
  timeline: OrderHistoryItem[];
  loading?: boolean;
  allowAddNotes?: boolean;
  onRefresh?: () => void;
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ 
  orderId, 
  timeline, 
  loading = false,
  allowAddNotes = false,
  onRefresh
}) => {
  const theme = useTheme();
  const [addNoteOpen, setAddNoteOpen] = useState<boolean>(false);
  const [noteContent, setNoteContent] = useState<string>('');
  const [addingNote, setAddingNote] = useState<boolean>(false);
  
  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    
    try {
      setAddingNote(true);
      const note: OrderNote = {
        orderId,
        content: noteContent,
        isInternal: false
      };
      
      await addOrderNote(orderId, note);
      setNoteContent('');
      setAddNoteOpen(false);
      
      // Refresh timeline if callback provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setAddingNote(false);
    }
  };
  
  // Render loading skeleton
  if (loading) {
    return (
      <Box>
        {[1, 2, 3].map((i) => (
          <TimelineItem key={i}>
            <TimelineOppositeContent sx={{ flex: 0.3 }}>
              <Skeleton variant="text" width="80%" />
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot>
                <Skeleton variant="circular" width={24} height={24} />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Skeleton variant="rectangular" width="90%" height={60} />
            </TimelineContent>
          </TimelineItem>
        ))}
      </Box>
    );
  }
  
  // Sort timeline by timestamp (newest first for display)
  const sortedTimeline = [...timeline].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  return (
    <Box sx={{ width: '100%' }}>
      {allowAddNotes && (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            mb: 2 
          }}
        >
          <Button 
            startIcon={<AddNoteIcon />} 
            variant="outlined" 
            onClick={() => setAddNoteOpen(true)}
          >
            Add Note
          </Button>
        </Box>
      )}
      
      <Timeline position="alternate">
        {sortedTimeline.map((item, index) => {
          const isNoteEntry = !item.status && item.note;
          const icon = isNoteEntry ? <CommentIcon /> : getStatusIcon(item.status);
          const color = isNoteEntry ? 'default' : getStatusColor(item.status);
          
          return (
            <TimelineItem key={item.id || index}>
              <TimelineOppositeContent 
                sx={{ 
                  m: 'auto 0',
                  color: theme.palette.text.secondary
                }}
              >
                <Typography variant="body2">
                  {formatDate(item.timestamp)}
                </Typography>
              </TimelineOppositeContent>
              
              <TimelineSeparator>
                <TimelineDot color={color as any}>
                  {icon}
                </TimelineDot>
                {index < sortedTimeline.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              
              <TimelineContent>
                <Paper elevation={3} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" component="span">
                      {isNoteEntry ? 'Note Added' : getStatusLabel(item.status)}
                    </Typography>
                    
                    {!isNoteEntry && (
                      <Chip 
                        label={getStatusLabel(item.status)} 
                        color={color as any} 
                        size="small" 
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                  
                  {item.note && (
                    <Typography variant="body2">
                      {item.note}
                    </Typography>
                  )}
                  
                  {item.previousStatus && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption">
                        Previous status: {getStatusLabel(item.previousStatus)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" display="block" sx={{ color: theme.palette.text.secondary }}>
                      {item.user.includes('@') ? `By: ${item.user}` : `By: ${item.user}`}
                    </Typography>
                  </Box>
                </Paper>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
      
      {/* Add Note Dialog */}
      <Dialog 
        open={addNoteOpen} 
        onClose={() => setAddNoteOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Note to Order</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="note"
            label="Note"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddNoteOpen(false)} disabled={addingNote}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddNote} 
            variant="contained" 
            disabled={!noteContent.trim() || addingNote}
            startIcon={addingNote ? <CircularProgress size={20} /> : null}
          >
            {addingNote ? 'Adding...' : 'Add Note'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderTimeline; 