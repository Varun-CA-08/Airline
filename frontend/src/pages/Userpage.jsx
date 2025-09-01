import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from "@mui/material";

import {
  AdminPanelSettings as AdminIcon,
  FlightTakeoff as AirlineIcon,
  Work as BaggageIcon,
  Person as PersonIcon,
  Add as AddIcon
} from "@mui/icons-material";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user"
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch users: ${res.status}`);
      }

      const data = await res.json();
      setUsers(data);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "user"
    });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setError("");
    setSuccess("");
  };

  const handleRegisterUser = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }

      setSuccess("User registered successfully!");
      handleCloseDialog();
      fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to register user");
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin": return <AdminIcon fontSize="small" sx={{ color: "#1565c0" }} />;
      case "airline": return <AirlineIcon fontSize="small" sx={{ color: "#1e88e5" }} />;
      case "baggage": return <BaggageIcon fontSize="small" sx={{ color: "#42a5f5" }} />;
      default: return <PersonIcon fontSize="small" sx={{ color: "#90caf9" }} />;
    }
  };

  const formatRoleName = (role) => role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1565c0" }}>
        
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
          Add User
        </Button>
      </Box>

      {/* Messages */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Users Table */}
      <TableContainer component={Paper} sx={{ border: "1px solid #0d47a1" }}>
  <Table>
    <TableHead>
      <TableRow sx={{ backgroundColor: "#0d47a1" }}>
        <TableCell sx={{ fontWeight: "bold", color: "#ffffff" }}>User</TableCell>
        <TableCell sx={{ fontWeight: "bold", color: "#ffffff" }}>Email</TableCell>
        <TableCell sx={{ fontWeight: "bold", color: "#ffffff" }}>Role</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {users.map((user, index) => (
        <TableRow
          key={user._id}
          sx={{
            backgroundColor: index % 2 === 0 ? "#e3f2fd" : "#bbdefb"
          }}
        >
          <TableCell>{user.name}</TableCell>
          <TableCell>{user.email}</TableCell>
          <TableCell sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {getRoleIcon(user.role)} {formatRoleName(user.role)}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
      {/* Add User Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Register New User</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Full Name" name="name" value={formData.name} onChange={handleInputChange} fullWidth required />
            <TextField label="Email Address" name="email" value={formData.email} onChange={handleInputChange} fullWidth required />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select name="role" value={formData.role} onChange={handleInputChange} label="Role">
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="airline">Airline</MenuItem>
                <MenuItem value="baggage">Baggage</MenuItem>
                              </Select>
            </FormControl>
            <TextField label="Password" name="password" type="password" value={formData.password} onChange={handleInputChange} fullWidth required />
            <TextField label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} fullWidth required />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleRegisterUser}
            disabled={!formData.name || !formData.email || !formData.password || !formData.confirmPassword}
          >
            Register
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
