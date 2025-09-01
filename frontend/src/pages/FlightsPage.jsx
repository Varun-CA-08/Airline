import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Flight as FlightIcon
} from "@mui/icons-material";

export default function Flights() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [formData, setFormData] = useState({
    flightNo: "",
    origin: "",
    destination: "",
    status: "scheduled",
    gate: "",
    scheduledDep: "",
    scheduledArr: ""
  });

  // 🔹 Helpers for date conversion
  const toUTCISOString = (localDateTimeString) => {
    if (!localDateTimeString) return null;
    const localDate = new Date(localDateTimeString); // interprets local
    return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString();
  };

  const formatForInput = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
  };

  // Fetch user role from session storage
  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserRole(user.role || "");
      } catch (error) {
        console.error("Error parsing user data:", error);
        const storedRole = sessionStorage.getItem("role");
        setUserRole(storedRole || "");
      }
    } else {
      const storedRole = sessionStorage.getItem("role");
      setUserRole(storedRole || "");
    }
  }, []);

  // Check if user can perform actions
  const canAddFlight = ["admin", "airline"].includes(userRole);
  const canEditFlight = ["admin", "airline"].includes(userRole);
  const canDeleteFlight = ["admin"].includes(userRole);

  // Fetch flights
  const fetchFlights = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/flights`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch flights: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      setFlights(data);
      setError("");
    } catch (err) {
      console.error("Error fetching flights:", err);
      setError(err.message || "Failed to load flights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      flightNo: "",
      origin: "",
      destination: "",
      status: "scheduled",
      gate: "",
      scheduledArr: "",
      scheduledDep: "",
    });
    setEditingFlight(null);
  };

  // Open dialog for add/edit
  const handleOpenDialog = (flight = null) => {
    if (flight) {
      setEditingFlight(flight);
      setFormData({
        flightNo: flight.flightNo,
        origin: flight.origin,
        destination: flight.destination,
        status: flight.status,
        gate: flight.gate || "",
        scheduledArr: formatForInput(flight.scheduledArr),
        scheduledDep: formatForInput(flight.scheduledDep),
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  // Add flight
  const handleAddFlight = async () => {
    try {
      const body = {
        ...formData,
        scheduledDep: toUTCISOString(formData.scheduledDep),
        scheduledArr: toUTCISOString(formData.scheduledArr),
      };

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/flights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to add flight: ${res.status}`);
      }

      setSuccess("Flight added successfully!");
      handleCloseDialog();
      fetchFlights();
    } catch (err) {
      console.error("Error adding flight:", err);
      setError(err.message || "Failed to add flight");
    }
  };

  // Update flight
  const handleUpdateFlight = async () => {
    try {
      const body = {
        ...formData,
        scheduledDep: toUTCISOString(formData.scheduledDep),
        scheduledArr: toUTCISOString(formData.scheduledArr),
      };

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/flights/${editingFlight._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to update flight: ${res.status}`);
      }

      setSuccess("Flight updated successfully!");
      handleCloseDialog();
      fetchFlights();
    } catch (err) {
      console.error("Error updating flight:", err);
      setError(err.message || "Failed to update flight");
    }
  };

  // Delete flight
  const handleDeleteFlight = async (id) => {
    if (!window.confirm("Are you sure you want to delete this flight?")) {
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/flights/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to delete flight: ${res.status}`);
      }

      setSuccess("Flight deleted successfully!");
      fetchFlights();
    } catch (err) {
      console.error("Error deleting flight:", err);
      setError(err.message || "Failed to delete flight");
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'boarding': return 'info';
      case 'departed': return 'secondary';
      case 'arrived': return 'success';
      case 'delayed': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const getCardBgColor = (index) => {
    const colsPerRow = 4;
    const row = Math.floor(index / colsPerRow);
    const col = index % colsPerRow;
    return (row + col) % 2 === 0 ? '#ffffff' : '#bbdefb';
  };

  return (
    <Box sx={{ 
      p: 3, 
      border: '3px solid #1976d2', 
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(25, 118, 210, 0.15)',
      backgroundColor: 'white'
    }}>
      {/* Header */}
      {canAddFlight && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          mb: 3,
          p: 1,
          borderRadius: '8px',
          backgroundColor: 'rgba(25, 118, 210, 0.05)'
        }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: '#1976d2',
              borderRadius: '20px',
              px: 3,
              py: 1,
              '&:hover': {
                backgroundColor: '#1565c0'
              }
            }}
          >
            Add Flight
          </Button>
        </Box>
      )}

      {/* Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* Loading state */}
      {loading && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          border: '2px dashed #1976d2',
          borderRadius: '8px',
          backgroundColor: 'rgba(25, 118, 210, 0.05)'
        }}>
          <Typography variant="h6" color="primary">
            Loading flights...
          </Typography>
        </Box>
      )}

      {/* Flights Grid */}
      <Grid container spacing={3}>
        {flights.map((flight, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={flight._id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#d4e5f5ff',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                border: '2px solid #bbdefb',
                borderRadius: '12px',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
                  border: '2px solid #64b5f6'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  mb: 2,
                  pb: 1,
                  borderBottom: '1px solid #e3f2fd'
                }}>
                  <Typography variant="h6" component="h2" color="primary" noWrap>
                    {flight.flightNo}
                  </Typography>
                  <Chip 
                    label={flight.status} 
                    color={getStatusColor(flight.status)} 
                    size="small" 
                    sx={{ fontWeight: 'bold', flexShrink: 0 }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '70px', flexShrink: 0 }}>
                      Route:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      {flight.origin} → {flight.destination}
                    </Typography>
                  </Box>
                  
                  {flight.gate && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '70px', flexShrink: 0 }}>
                        Gate:
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {flight.gate}
                      </Typography>
                    </Box>
                  )}
                  
                  {flight.scheduledDep && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '70px', flexShrink: 0 }}>
                        Departure:
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {formatDate(flight.scheduledDep)}
                      </Typography>
                    </Box>
                  )}
                  
                  {flight.scheduledArr && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '70px', flexShrink: 0 }}>
                        Arrival:
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {formatDate(flight.scheduledArr)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
              
              <CardActions sx={{ 
                justifyContent: 'flex-end', 
                backgroundColor: 'rgba(25, 118, 210, 0.03)',
                borderTop: '1px solid #e3f2fd',
                py: 1,
                mt: 'auto'
              }}>
                {canEditFlight && (
                  <IconButton 
                    color="primary" 
                    onClick={() => handleOpenDialog(flight)}
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.2)' }
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                )}
                
                {canDeleteFlight && (
                  <IconButton 
                    color="error" 
                    onClick={() => handleDeleteFlight(flight._id)}
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.2)' }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty state */}
      {!loading && flights.length === 0 && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 4,
          border: '2px dashed #1976d2',
          borderRadius: '12px',
          backgroundColor: 'rgba(25, 118, 210, 0.05)'
        }}>
          <FlightIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" color="primary" gutterBottom>
            No flights found
          </Typography>
          {canAddFlight && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ 
                mt: 2,
                backgroundColor: '#1976d2',
                borderRadius: '20px',
                px: 3,
                py: 1,
                '&:hover': {
                  backgroundColor: '#1565c0'
                }
              }}
            >
              Add Your First Flight
            </Button>
          )}
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            border: '2px solid #1976d2',
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#1976d2', 
          color: 'white',
          borderRadius: '10px 10px 0 0'
        }}>
          {editingFlight ? "Edit Flight" : "Add New Flight"}
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Flight Number"
              name="flightNo"
              value={formData.flightNo}
              onChange={handleInputChange}
              required
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
            
            <TextField
              label="Origin"
              name="origin"
              value={formData.origin}
              onChange={handleInputChange}
              required
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
            
            <TextField
              label="Destination"
              name="destination"
              value={formData.destination}
              onChange={handleInputChange}
              required
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleInputChange}
                sx={{
                  borderRadius: '8px'
                }}
              >
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="boarding">Boarding</MenuItem>
                <MenuItem value="departed">Departed</MenuItem>
                <MenuItem value="arrived">Arrived</MenuItem>
                <MenuItem value="delayed">Delayed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Gate"
              name="gate"
              value={formData.gate}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
            
            <TextField
              label="Scheduled Departure"
              name="scheduledDep"
              type="datetime-local"
              value={formData.scheduledDep}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
            
            <TextField
              label="Scheduled Arrival"
              name="scheduledArr"
              type="datetime-local"
              value={formData.scheduledArr}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ borderRadius: '20px', px: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={editingFlight ? handleUpdateFlight : handleAddFlight} 
            variant="contained"
            disabled={!formData.flightNo || !formData.origin || !formData.destination}
            sx={{ 
              borderRadius: '20px', 
              px: 3,
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0'
              }
            }}
          >
            {editingFlight ? "Update" : "Add"} Flight
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}