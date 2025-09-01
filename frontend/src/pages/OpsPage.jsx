import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import CachedIcon from '@mui/icons-material/Cached';
import DatabaseIcon from '@mui/icons-material/Storage';

export default function Operations() {
  const [allFlights, setAllFlights] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [delayDialogOpen, setDelayDialogOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [delayData, setDelayData] = useState({ reason: "", newTime: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState({ analytics: null });

  // Filter flights to only show those that can have delays reported
  const filterFlights = (flights) => {
    return flights.filter(flight => 
      flight.status !== 'cancelled' && 
      flight.status !== 'arrived'
    );
  };

  const filteredFlights = filterFlights(allFlights);

  // Fetch flights from backend
  const fetchFlights = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/flights`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setAllFlights(data);
      }
    } catch (err) {
      setMessage("Error fetching flights");
    }
  };

  // Fetch analytics from backend
  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/operations/analytics`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.data);
        setDataSource(prev => ({ ...prev, analytics: data.source }));
      }
    } catch (err) {
      setMessage("Error fetching analytics");
    }
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchFlights(), fetchAnalytics()]);
    setLoading(false);
    setRefreshing(false);
  };

  // Refresh data manually
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDelayDialog = (flight) => {
    setSelectedFlight(flight);
    setDelayData({ reason: "", newTime: "" });
    setDelayDialogOpen(true);
  };

  const handleCloseDelayDialog = () => {
    setDelayDialogOpen(false);
    setSelectedFlight(null);
  };

  const handleDelayInputChange = (e) => {
    const { name, value } = e.target;
    setDelayData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitDelay = async () => {
    try {
      // Convert datetime-local value to ISO string
      const isoTime = delayData.newTime ? new Date(delayData.newTime).toISOString() : null;

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/operations/flights/${selectedFlight._id}/delay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            reason: delayData.reason,
            newTime: isoTime,
          }),
        }
      );

      if (res.ok) {
        setMessage(`Delay reported for flight ${selectedFlight.flightNo}`);
        handleCloseDelayDialog();
        // Refresh data after reporting delay
        setRefreshing(true);
        await loadData();
      } else {
        setMessage("Failed to report delay");
      }
    } catch (err) {
      setMessage("Error reporting delay");
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'boarding': return 'info';
      case 'departed': return 'secondary';
      case 'delayed': return 'warning';
      case 'cancelled': return 'error';
      case 'arrived': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with refresh button and text */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        p: 2,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1
      }}>
        <Box>
          {dataSource.analytics && (
            <Chip 
              label={dataSource.analytics === 'redis' ? 'Data from cache' : 'Data from database'} 
              color={dataSource.analytics === 'redis' ? 'success' : 'primary'}
              variant="filled"
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          )}
        </Box>
        
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh}
          disabled={refreshing}
          variant="contained"
          color="primary"
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {message && (
        <Alert 
          severity={message.includes("Error") || message.includes("Failed") ? "error" : "success"} 
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setMessage("")}
        >
          {message}
        </Alert>
      )}

      {refreshing && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          mb: 2,
          p: 1,
          backgroundColor: 'action.hover',
          borderRadius: 1
        }}>
          <CircularProgress size={20} sx={{ mr: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Refreshing data...
          </Typography>
        </Box>
      )}

      {/* Analytics Cards */}
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        mb: 4,
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Card sx={{ 
          flex: 1, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3,
          boxShadow: 3
        }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom sx={{ opacity: 0.9, fontWeight: 500 }}>
              Flights Today
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              {analytics?.totalFlightsToday || 0}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Total flights scheduled
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ 
          flex: 1, 
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          color: 'white',
          borderRadius: 3,
          boxShadow: 3
        }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom sx={{ opacity: 0.9, fontWeight: 500 }}>
              Baggage Processed
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              {analytics?.totalBaggageProcessed || 0}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Bags handled today
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ 
          flex: 1, 
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
          color: 'white',
          borderRadius: 3,
          boxShadow: 3
        }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom sx={{ opacity: 0.9, fontWeight: 500 }}>
              Active Flights
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              {filteredFlights.length}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Can report delays
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Flights Table */}
      <Box sx={{ 
        backgroundColor: 'background.paper', 
        borderRadius: 3, 
        p: 3, 
        boxShadow: 2,
        mb: 3 
      }}>
        {/* <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          
        </Box> */}
        
        {filteredFlights.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              ✈️ No active flights available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All flights are either arrived or cancelled
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Flight No</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Route</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Departure</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFlights.map((flight) => (
                  <TableRow 
                    key={flight._id}
                    sx={{ 
                      '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                      '&:hover': { backgroundColor: 'action.selected' }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 'bold' }}>{flight.flightNo}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {flight.origin} → {flight.destination}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={flight.status.toUpperCase()} 
                        color={getStatusColor(flight.status)} 
                        size="small"
                        sx={{ fontWeight: 'bold', minWidth: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {new Date(flight.scheduledDep).toLocaleString('en-GB', { 
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false 
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color={flight.status === 'delayed' ? 'warning' : 'primary'}
                        onClick={() => handleOpenDelayDialog(flight)}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      >
                        {flight.status === 'delayed' ? 'UPDATE DELAY' : 'REPORT DELAY'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Delay Dialog - keep existing code */}
      <Dialog open={delayDialogOpen} onClose={handleCloseDelayDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Report Delay - {selectedFlight?.flightNo}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Route: {selectedFlight?.origin} → {selectedFlight?.destination}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Departure: {selectedFlight && new Date(selectedFlight.scheduledDep).toLocaleString()}
            </Typography>
            
            <TextField
              fullWidth
              label="Delay Reason"
              name="reason"
              value={delayData.reason}
              onChange={handleDelayInputChange}
              multiline
              rows={3}
              sx={{ mt: 2 }}
              placeholder="Enter reason for delay (weather, technical issues, etc.)"
            />
            <TextField
              fullWidth
              label="New Departure Date & Time"
              name="newTime"
              type="datetime-local"
              value={delayData.newTime}
              onChange={handleDelayInputChange}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelayDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmitDelay} 
            variant="contained"
            color="warning"
            disabled={!delayData.reason}
          >
            Submit Delay Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
   
  );
}




