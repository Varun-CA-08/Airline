import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button
} from "@mui/material";
import {
  Flight as FlightIcon,
  Luggage as LuggageIcon,
  Person as PersonIcon,
  People as StaffIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  FlightTakeoff as FlightTakeoffIcon
} from "@mui/icons-material";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [flightStats, setFlightStats] = useState(null);
  const [baggageOverview, setBaggageOverview] = useState(null);
  const [activeFlights, setActiveFlights] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all dashboard data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [overviewRes, flightStatsRes, baggageRes, activeFlightsRes, notificationsRes] = await Promise.all([
        fetch(`${baseUrl}/dashboard/overview`, { headers }),
        fetch(`${baseUrl}/dashboard/flight-stats`, { headers }),
        fetch(`${baseUrl}/dashboard/baggage-overview`, { headers }),
        fetch(`${baseUrl}/dashboard/active-flights`, { headers }),
        fetch(`${baseUrl}/dashboard/notifications?limit=5`, { headers })
      ]);

      if (!overviewRes.ok) throw new Error(`Overview API failed: ${overviewRes.status}`);
      if (!flightStatsRes.ok) throw new Error(`Flight stats API failed: ${flightStatsRes.status}`);
      if (!baggageRes.ok) throw new Error(`Baggage API failed: ${baggageRes.status}`);
      if (!activeFlightsRes.ok) throw new Error(`Active flights API failed: ${activeFlightsRes.status}`);
      if (!notificationsRes.ok) throw new Error(`Notifications API failed: ${notificationsRes.status}`);

      const [overview, flightStatsData, baggageData, activeFlightsData, notificationsData] = await Promise.all([
        overviewRes.json(),
        flightStatsRes.json(),
        baggageRes.json(),
        activeFlightsRes.json(),
        notificationsRes.json()
      ]);

      setDashboardData(overview);
      setFlightStats(flightStatsData);
      setBaggageOverview(baggageData);
      setActiveFlights(activeFlightsData);
      setNotifications(notificationsData);
      setError("");
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Prepare chart data
  const prepareFlightDistributionData = () => {
    if (!flightStats?.byStatus) return [];
    
    const colors = ['#3b82f6', '#9dd406ff', '#8b5cf6', '#f59e0b', '#ef4444'];
    return Object.entries(flightStats.byStatus).map(([status, count], index) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: colors[index % colors.length]
    }));
  };

  const prepareBaggageBarData = () => {
    if (!baggageOverview?.byStatus) return [];
    
    return Object.entries(baggageOverview.byStatus).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      count: count,
      fill: '#3b82f6'
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      'scheduled': '#06b6d4',
      'boarding': '#f59e0b', 
      'departed': '#10b981',
      'delayed': '#ef4444',
      'cancelled': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ 
          color: '#1976d2', 
          fontWeight: 'bold'
        }}>
          Flight Operations Dashboard
        </Typography>
       
      </Box>

      {/* Top Cards - 4 Stats with full width rectangular design */}
      <Grid container spacing={3} sx={{ mb: 4 }} wrap="nowrap">

        {/* Total Flights Card */}
        <Grid item xs={12} sm={6} xl={3}>
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            height: '160px',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(120deg, #4a90e2 0%, #2b5cb0 100%)',
            display: 'flex',
            alignItems: 'center'
          }}>
            {/* Overlay airplane image effect */}
            <Box sx={{
              position: 'absolute',
              right: 20,
              opacity: 0.15,
              transform: 'scale(3.5)',
              color: 'white'
            }}>
              <FlightIcon sx={{ fontSize: 80 }} />
            </Box>
            <CardContent sx={{ 
              position: 'relative',
              zIndex: 2,
              width: '100%',
              p: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h2" component="div" fontWeight="bold" color="white">
                  {dashboardData?.flights?.total || 0}
                </Typography>
                <Typography variant="h5" color="rgba(255,255,255,0.9)" sx={{ mt: 1 }}>
                  Total Flights
                </Typography>
              </Box>
              <Box sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                borderRadius: '50%', 
                width: 70, 
                height: 70,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                ml: 2
              }}>
                <FlightIcon sx={{ fontSize: 35 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Baggage Card */}
        <Grid item xs={12} sm={6} xl={3}>
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            height: '160px',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(120deg, #6a5acd 0%, #4b3bac 100%)',
            display: 'flex',
            alignItems: 'center'
          }}>
            {/* Overlay luggage image effect */}
            <Box sx={{
              position: 'absolute',
              right: 20,
              opacity: 0.15,
              transform: 'scale(3.5)',
              color: 'white'
            }}>
              <LuggageIcon sx={{ fontSize: 80 }} />
            </Box>
            <CardContent sx={{ 
              position: 'relative',
              zIndex: 2,
              width: '100%',
              p: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h2" component="div" fontWeight="bold" color="white">
                  {dashboardData?.baggage?.total || 0}
                </Typography>
                <Typography variant="h5" color="rgba(255,255,255,0.9)" sx={{ mt: 1 }}>
                  Total Baggage
                </Typography>
              </Box>
              <Box sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                borderRadius: '50%', 
                width: 70, 
                height: 70,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                ml: 2
              }}>
                <LuggageIcon sx={{ fontSize: 35 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Passengers Card */}
        <Grid item xs={12} sm={6} xl={3}>
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            height: '160px',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(120deg, #ff7e5f 0%, #feb47b 100%)',
            display: 'flex',
            alignItems: 'center'
          }}>
            {/* Overlay person image effect */}
            <Box sx={{
              position: 'absolute',
              right: 20,
              opacity: 0.15,
              transform: 'scale(3.5)',
              color: 'white'
            }}>
              <PersonIcon sx={{ fontSize: 80 }} />
            </Box>
            <CardContent sx={{ 
              position: 'relative',
              zIndex: 2,
              width: '100%',
              p: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h2" component="div" fontWeight="bold" color="white">
                  {dashboardData?.users?.passengers || 0}
                </Typography>
                <Typography variant="h5" color="rgba(255,255,255,0.9)" sx={{ mt: 1 }}>
                  Total Passengers
                </Typography>
              </Box>
              <Box sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                borderRadius: '50%', 
                width: 70, 
                height: 70,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                ml: 2
              }}>
                <PersonIcon sx={{ fontSize: 35 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Staff Card */}
        <Grid item xs={12} sm={6} xl={3}>
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            height: '160px',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(120deg, #00cdac 0%, #02aab0 100%)',
            display: 'flex',
            alignItems: 'center'
          }}>
            {/* Overlay staff image effect */}
            <Box sx={{
              position: 'absolute',
              right: 20,
              opacity: 0.15,
              transform: 'scale(3.5)',
              color: 'white'
            }}>
              <StaffIcon sx={{ fontSize: 80 }} />
            </Box>
            <CardContent sx={{ 
              position: 'relative',
              zIndex: 2,
              width: '100%',
              p: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h2" component="div" fontWeight="bold" color="white">
                  {dashboardData?.users?.staff || 0}
                </Typography>
                <Typography variant="h5" color="rgba(255,255,255,0.9)" sx={{ mt: 1 }}>
                  Total Staff
                </Typography>
              </Box>
              <Box sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                borderRadius: '50%', 
                width: 70, 
                height: 70,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                ml: 2
              }}>
                <StaffIcon sx={{ fontSize: 35 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Box sx={{ overflowX: 'auto' }}/>
  <Grid container spacing={3} wrap="nowrap">
        {/* Left Column */}
         <Grid item xs={12} md={8}>
          {/* Active Flights Table */}
          <Paper sx={{ 
    p: 3, 
    mb: 3, 
    borderRadius: 2, 
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    backgroundColor: '#e8f4fd' // Light blue background
  }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                Active Flights
              </Typography>
              
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#80c6f7ff' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Flight No.</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Origin</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Destination</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Departure</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Baggage Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeFlights?.flights?.slice(0, 5).map((flight, index) => (
                    <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>{flight.flightNo}</TableCell>
                      <TableCell>{flight.origin}</TableCell>
                      <TableCell>{flight.destination}</TableCell>
                      <TableCell>
                        <Chip 
                          label={flight.status} 
                          sx={{ 
                            backgroundColor: getStatusColor(flight.status),
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {flight.scheduledDep ? new Date(flight.scheduledDep).toLocaleTimeString() : 'N/A'}
                      </TableCell>
                      <TableCell>{flight.baggageCount || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Baggage Performance Bar Chart */}
          {/* Baggage Performance Bar Chart */}
<Paper sx={{ 
  p: 3, 
  borderRadius: 2, 
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  backgroundColor: '#e8f4fd' // Light blue background
}}>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
      Baggage Performance
    </Typography>
    
  </Box>
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={prepareBaggageBarData()}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
      <XAxis 
        dataKey="name" 
        tick={{ fill: '#666' }}
        axisLine={{ stroke: '#e0e0e0' }}
      />
      <YAxis 
        tick={{ fill: '#666' }}
        axisLine={{ stroke: '#e0e0e0' }}
      />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: '#fff', 
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      />
      <Bar 
        dataKey="count" 
        radius={[4, 4, 0, 0]}
        barSize={30} // Thinner bars
      >
        {prepareBaggageBarData().map((entry, index) => (
          <Cell 
            key={`cell-${index}`} 
            fill={index % 2 === 0 ? '#3b82f6' : '#90caf9'} // Alternating blue colors
          />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</Paper>
        </Grid>

        {/* Right Column */}
         <Grid item xs={12} md={4}>
          {/* Flight Distribution Pie Chart */}
          <Paper sx={{ 
    p: 3, 
    mb: 3, 
    borderRadius: 2, 
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    backgroundColor: '#e8f4fd' // Light blue background
  }}>
            <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 2 }}>
              Flight Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={prepareFlightDistributionData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {prepareFlightDistributionData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                {flightStats?.total || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Total Flights
              </Typography>
            </Box>
          </Paper>

          {/* Notifications */}
          <Paper sx={{ 
    p: 3, 
    mb: 3, 
    borderRadius: 2, 
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    backgroundColor: '#e8f4fd' // Light blue background
  }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotificationsIcon sx={{ color: '#1976d2', mr: 1 }} />
              <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                Notifications
              </Typography>
            </Box>
            <List>
              {notifications?.notifications?.slice(0, 5).map((notification, index) => (
                <ListItem key={index} sx={{ px: 0, py: 1 }}>
                  <ListItemIcon>
                    <FlightTakeoffIcon sx={{ color: '#f59e0b' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#333' }}>
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#999' }}>
                          {new Date(notification.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}