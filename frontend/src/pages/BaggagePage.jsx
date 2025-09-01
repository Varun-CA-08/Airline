import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  InputAdornment,
  Grid,
  Card,
  CardContent
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Luggage as LuggageIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Flight as FlightIcon,
  LocationOn as LocationIcon,
  Scale as ScaleIcon
} from "@mui/icons-material";

export default function Baggage() {
  const [baggages, setBaggages] = useState([]);
  const [filteredBaggages, setFilteredBaggages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBaggage, setEditingBaggage] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [formData, setFormData] = useState({
    tagId: "",
    flightId: "",
    weight: "",
    status: "checkin",
    lastLocation: ""
  });
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [flightFilter, setFlightFilter] = useState("");

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
  const canAddBaggage = ["admin", "baggage", "airline"].includes(userRole);
  const canEditBaggage = ["admin", "baggage"].includes(userRole);
  const canDeleteBaggage = ["admin", "baggage"].includes(userRole);

  // Fetch baggages
  const fetchBaggages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/baggage`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch baggages: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      setBaggages(data);
      setFilteredBaggages(data);
      setError("");
    } catch (err) {
      console.error("Error fetching baggages:", err);
      setError(err.message || "Failed to load baggages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaggages();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = baggages;

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(baggage => baggage.status === statusFilter);
    }

    // Apply flight filter
    if (flightFilter) {
      result = result.filter(baggage => 
        baggage.flightId?.flightNo?.toLowerCase().includes(flightFilter.toLowerCase()) ||
        baggage.flightId?._id?.includes(flightFilter)
      );
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(baggage =>
        baggage.tagId.toLowerCase().includes(term) ||
        (baggage.lastLocation && baggage.lastLocation.toLowerCase().includes(term)) ||
        (baggage.weight && baggage.weight.toString().includes(term))
      );
    }

    setFilteredBaggages(result);
  }, [baggages, searchTerm, statusFilter, flightFilter]);

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
      tagId: "",
      flightId: "",
      weight: "",
      status: "checkin",
      lastLocation: ""
    });
    setEditingBaggage(null);
  };

  // Open dialog for add/edit
  const handleOpenDialog = (baggage = null) => {
    if (baggage) {
      setEditingBaggage(baggage);
      setFormData({
        tagId: baggage.tagId,
        flightId: baggage.flightId._id || baggage.flightId,
        weight: baggage.weight || "",
        status: baggage.status,
        lastLocation: baggage.lastLocation || ""
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

  // Add baggage
  const handleAddBaggage = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/baggage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to add baggage: ${res.status}`);
      }

      setSuccess("Baggage added successfully!");
      handleCloseDialog();
      fetchBaggages();
    } catch (err) {
      console.error("Error adding baggage:", err);
      setError(err.message || "Failed to add baggage");
    }
  };

  // Update baggage
  const handleUpdateBaggage = async () => {
    try {
      const idOrTag = editingBaggage._id || editingBaggage.tagId;
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/baggage/${idOrTag}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to update baggage: ${res.status}`);
      }

      setSuccess("Baggage updated successfully!");
      handleCloseDialog();
      fetchBaggages();
    } catch (err) {
      console.error("Error updating baggage:", err);
      setError(err.message || "Failed to update baggage");
    }
  };

  // Delete baggage
  const handleDeleteBaggage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this baggage?")) {
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/baggage/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to delete baggage: ${res.status}`);
      }

      setSuccess("Baggage deleted successfully!");
      fetchBaggages();
    } catch (err) {
      console.error("Error deleting baggage:", err);
      setError(err.message || "Failed to delete baggage");
    }
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'checkin': 
        return { color: 'primary', icon: <CheckCircleIcon sx={{ fontSize: '16px' }} /> };
      case 'loaded': 
        return { color: 'info', icon: <FlightIcon sx={{ fontSize: '16px' }} /> };
      case 'inTransit': 
        return { color: 'secondary', icon: <FlightIcon sx={{ fontSize: '16px' }} /> };
      case 'unloaded': 
        return { color: 'warning', icon: <LuggageIcon sx={{ fontSize: '16px' }} /> };
      case 'atBelt': 
        return { color: 'success', icon: <CheckCircleIcon sx={{ fontSize: '16px' }} /> };
      case 'lost': 
        return { color: 'error', icon: <ClearIcon sx={{ fontSize: '16px' }} /> };
      default: 
        return { color: 'default', icon: <LuggageIcon sx={{ fontSize: '16px' }} /> };
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    return status.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  // Clear search and filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setFlightFilter("");
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      

      {/* Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* Search and Filter Section */}
      <Card sx={{ 
        mb: 3, 
        borderRadius: 3, 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={8}>
              <Grid container spacing={2} alignItems="flex-end">
                {/* Search Field */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="Search by Tag ID, Location, or Weight..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: '#fafafa',
                          boxShadow: '0 0 0 2px rgba(66, 153, 225, 0.1)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: '#fff',
                          boxShadow: '0 0 0 2px rgba(66, 153, 225, 0.2)',
                        }
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="primary" fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm && (
                        <InputAdornment position="end">
                          <IconButton 
                            size="small" 
                            onClick={() => setSearchTerm("")}
                            sx={{ color: 'text.secondary' }}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                {/* Flight Filter */}
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    label="Flight Filter"
                    placeholder="Flight No or ID"
                    value={flightFilter}
                    onChange={(e) => setFlightFilter(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: '#fafafa',
                          boxShadow: '0 0 0 2px rgba(66, 153, 225, 0.1)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: '#fff',
                          boxShadow: '0 0 0 2px rgba(66, 153, 225, 0.2)',
                        }
                      }
                    }}
                    InputProps={{
                      endAdornment: flightFilter && (
                        <InputAdornment position="end">
                          <IconButton 
                            size="small" 
                            onClick={() => setFlightFilter("")}
                            sx={{ color: 'text.secondary' }}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                {/* Status Filter */}
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: 'white',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: '#fafafa',
                          boxShadow: '0 0 0 2px rgba(66, 153, 225, 0.1)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: '#fff',
                          boxShadow: '0 0 0 2px rgba(66, 153, 225, 0.2)',
                        }
                      }}
                    >
                      <MenuItem value="all">All Statuses</MenuItem>
                      <MenuItem value="checkin">Check-in</MenuItem>
                      <MenuItem value="loaded">Loaded</MenuItem>
                      <MenuItem value="inTransit">In Transit</MenuItem>
                      <MenuItem value="unloaded">Unloaded</MenuItem>
                      <MenuItem value="atBelt">At Belt</MenuItem>
                      <MenuItem value="lost">Lost</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Clear Filters Button - Only show when filters are active */}
                {(searchTerm || statusFilter !== "all" || flightFilter) && (
                  <Grid item xs={12} sm={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={clearFilters}
                      startIcon={<ClearIcon />}
                      sx={{
                        borderRadius: 2,
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderWidth: 1.5,
                        '&:hover': {
                          borderWidth: 1.5,
                          backgroundColor: 'primary.main',
                          color: 'white',
                        }
                      }}
                    >
                      Clear
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Grid>
            
            {/* Add Baggage Button */}
            {canAddBaggage && (
              <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    background: 'linear-gradient(45deg, #1976d2 0%, #0d47a1 100%)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1565c0 0%, #0b3d91 100%)',
                      boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                    }
                  }}
                >
                  Add Baggage
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Results Count */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
      </Box>

      {/* Baggage Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0'
        }}
      >
        <Table sx={{ minWidth: 650 }} aria-label="baggage table">
          <TableHead>
            <TableRow sx={{ 
              backgroundColor: 'primary.main',
              '& th': {
                color: 'white',
                fontWeight: 600,
                fontSize: '1rem',
                borderBottom: '2px solid #e2e8f0'
              }
            }}>
              <TableCell>Tag ID</TableCell>
              <TableCell>Flight</TableCell>
              <TableCell>Weight (kg)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Location</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBaggages.map((baggage) => {
              const statusInfo = getStatusInfo(baggage.status);
              return (
                <TableRow 
                  key={baggage._id}
                  sx={{ 
                    '&:nth-of-type(even)': { backgroundColor: '#f8fafc' },
                    '&:hover': { backgroundColor: '#f1f5f9' },
                    '& td': { 
                      borderBottom: '1px solid #e2e8f0',
                      py: 1.5
                    }
                  }}
                >
                  <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                    {baggage.tagId}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FlightIcon color="action" sx={{ fontSize: 18 }} />
                      {baggage.flightId?.flightNo || `Flight: ${baggage.flightId}`}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScaleIcon color="action" sx={{ fontSize: 18 }} />
                      {baggage.weight || 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={statusInfo.icon}
                      label={formatStatus(baggage.status)} 
                      color={statusInfo.color} 
                      size="medium"
                      sx={{ 
                        fontWeight: 600,
                        minWidth: 100,
                        '& .MuiChip-icon': { color: 'inherit' }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon color="action" sx={{ fontSize: 18 }} />
                      {baggage.lastLocation || 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {canEditBaggage && (
                        <IconButton 
                          color="primary" 
                          onClick={() => handleOpenDialog(baggage)}
                          size="medium"
                          sx={{ 
                            backgroundColor: 'primary.light',
                            color: 'white',
                            '&:hover': { backgroundColor: 'primary.dark' }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                      
                      {canDeleteBaggage && (
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteBaggage(baggage._id)}
                          size="medium"
                          sx={{ 
                            backgroundColor: 'error.light',
                            color: 'white',
                            '&:hover': { backgroundColor: 'error.dark' }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Empty state */}
      {!loading && filteredBaggages.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <LuggageIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {baggages.length === 0 ? 'No baggage records found' : 'No matching baggage records found'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {baggages.length === 0 ? 'Get started by adding your first baggage item' : 'Try adjusting your search or filters'}
          </Typography>
          {(searchTerm || statusFilter !== "all" || flightFilter) && (
            <Button
              variant="outlined"
              onClick={clearFilters}
              sx={{ mt: 2, mr: 1 }}
            >
              Clear Search & Filters
            </Button>
          )}
          {canAddBaggage && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ mt: 2 }}
            >
              Add Baggage
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
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          backgroundColor: 'primary.main', 
          color: 'white',
          fontWeight: 600
        }}>
          {editingBaggage ? "Edit Baggage" : "Add New Baggage"}
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Tag ID"
              name="tagId"
              value={formData.tagId}
              onChange={handleInputChange}
              required
              fullWidth
              disabled={!!editingBaggage}
              variant="outlined"
              size="small"
            />
            
            <TextField
              label="Flight ID"
              name="flightId"
              value={formData.flightId}
              onChange={handleInputChange}
              required
              fullWidth
              variant="outlined"
              size="small"
            />
            
            <TextField
              label="Weight (kg)"
              name="weight"
              type="number"
              value={formData.weight}
              onChange={handleInputChange}
              inputProps={{ min: 0.1, max: 100, step: 0.1 }}
              fullWidth
              variant="outlined"
              size="small"
            />
            
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleInputChange}
                variant="outlined"
              >
                <MenuItem value="checkin">Check-in</MenuItem>
                <MenuItem value="loaded">Loaded</MenuItem>
                <MenuItem value="inTransit">In Transit</MenuItem>
                <MenuItem value="unloaded">Unloaded</MenuItem>
                <MenuItem value="atBelt">At Belt</MenuItem>
                <MenuItem value="lost">Lost</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Last Location"
              name="lastLocation"
              value={formData.lastLocation}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              size="small"
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={editingBaggage ? handleUpdateBaggage : handleAddBaggage} 
            variant="contained"
            disabled={!formData.tagId || !formData.flightId}
            sx={{ borderRadius: 2 }}
          >
            {editingBaggage ? "Update" : "Add"} Baggage
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}