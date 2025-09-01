import React, { useState, useEffect } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Avatar,
  Button,
  Menu,
  MenuItem,
  Divider,
  alpha,
  Paper,
  Chip
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Flight as FlightIcon,
  Luggage as LuggageIcon,
  Settings as OperationIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  FlightTakeoff as AirlineIcon,
  Work as BaggageIcon,
  AccountCircle as UserIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";

// Role-based avatar colors and icons
const roleConfig = {
  admin: {
    color: "#7b1fa2", // Purple
    icon: <AdminIcon sx={{ fontSize: 24 }} />,
    label: "Administrator"
  },
  airline: {
    color: "#0288d1", // Blue
    icon: <AirlineIcon sx={{ fontSize: 24 }} />,
    label: "Airline Staff"
  },
  baggage: {
    color: "#ed6c02", // Orange
    icon: <BaggageIcon sx={{ fontSize: 24 }} />,
    label: "Baggage Staff"
  },
  user: {
    color: "#2e7d32", // Green
    icon: <UserIcon sx={{ fontSize: 24 }} />,
    label: "Passenger"
  }
};

export default function FlightDashboard() {
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [navAnchorEl, setNavAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();

  // Get user data from session storage
  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setRole(user.role || "");
        setUserName(user.name || "Guest");
      } catch (error) {
        console.error("Error parsing user data:", error);
        const storedRole = sessionStorage.getItem("role");
        setRole(storedRole || "");
      }
    } else {
      const storedRole = sessionStorage.getItem("role");
      setRole(storedRole || "");
    }
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavMenuOpen = (event) => {
    setNavAnchorEl(event.currentTarget);
  };

  const handleNavMenuClose = () => {
    setNavAnchorEl(null);
  };

  const handleMenuItemClick = (item) => {
    navigate(item.path);
    handleNavMenuClose();
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
    handleMenuClose();
  };

  // Check if a menu item is selected based on current path
  const isSelected = (path) => {
    return location.pathname === `/home/${path}` || location.pathname.endsWith(path);
  };

  // Role-based menus
  const adminMenu = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "dashboard" },
    { text: "Flights", icon: <FlightIcon />, path: "flights" },
    { text: "Baggage", icon: <LuggageIcon />, path: "baggage" },
    { text: "Operations", icon: <OperationIcon />, path: "operations" },
    { text: "Users", icon: <PersonIcon />, path: "users" },
  ];

  const baggageMenu = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "dashboard" },
    { text: "Flights", icon: <FlightIcon />, path: "flights" },
    { text: "Baggage", icon: <LuggageIcon />, path: "baggage" }
  ];

  const airlineMenu = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "dashboard" },
    { text: "Flights", icon: <FlightIcon />, path: "flights" },
    { text: "Baggage", icon: <LuggageIcon />, path: "baggage" },
    { text: "Operations", icon: <OperationIcon />, path: "operations" },
  ];

  const userMenu = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "dashboard" },
    { text: "Flights", icon: <FlightIcon />, path: "flights" },
    { text: "Baggage", icon: <LuggageIcon />, path: "baggage" }
  ];

  let menuItems = [];
  if (role === "admin") menuItems = adminMenu;
  else if (role === "baggage") menuItems = baggageMenu;
  else if (role === "airline") menuItems = airlineMenu;
  else if (role === "user") menuItems = userMenu;
  else menuItems = [];

  const currentRoleConfig = roleConfig[role] || roleConfig.user;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "#f0f5ff" }}>
      {/* Top AppBar */}
      <AppBar
        position="sticky"
        sx={{
          bgcolor: "white",
          color: "text.primary",
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: "linear-gradient(90deg, #ffffff 0%, #f8fbff 100%)",
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, px: { xs: 2, md: 3 } }}>
          {/* Logo/Brand */}
          <Typography
            variant="h5"
            sx={{
              mr: 4,
              fontWeight: "bold",
              background: "linear-gradient(45deg, #2196f3 30%, #1976d2 90%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              display: { xs: "none", sm: "block" },
              fontFamily: "'Montserrat', sans-serif",
              textShadow: "0 2px 4px rgba(0,0,0,0.05)"
            }}
          >
            SkyLounge
          </Typography>

          {/* Navigation menu (for mobile) */}
          {isMobile && (
            <>
              <IconButton
                color="inherit"
                onClick={handleNavMenuOpen}
                sx={{ 
                  mr: 1, 
                  color: "primary.main",
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  }
                }}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={navAnchorEl}
                open={Boolean(navAnchorEl)}
                onClose={handleNavMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    borderRadius: 3,
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  }
                }}
              >
                {menuItems.map((item) => (
                  <MenuItem
                    key={item.text}
                    onClick={() => handleMenuItemClick(item)}
                    selected={isSelected(item.path)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      color: isSelected(item.path) ? "primary.main" : "text.primary",
                      backgroundColor: isSelected(item.path) ? alpha(theme.palette.primary.main, 0.08) : "transparent",
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                      borderLeft: isSelected(item.path) ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                      margin: '4px 8px',
                      borderRadius: '8px',
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {React.cloneElement(item.icon, { 
                        sx: { color: isSelected(item.path) ? theme.palette.primary.main : theme.palette.text.secondary } 
                      })}
                      <Typography variant="body1" fontWeight={isSelected(item.path) ? 600 : 400}>
                        {item.text}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}

          {/* Navigation (for desktop) */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1, flexGrow: 1 }}>
            {menuItems.map((item) => (
              <Button
                key={item.text}
                onClick={() => handleMenuItemClick(item)}
                startIcon={item.icon}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  color: isSelected(item.path) ? "primary.main" : "text.secondary",
                  backgroundColor: isSelected(item.path) ? alpha(theme.palette.primary.main, 0.12) : "transparent",
                  "&:hover": {
                    backgroundColor: isSelected(item.path) 
                      ? alpha(theme.palette.primary.main, 0.16) 
                      : alpha(theme.palette.primary.main, 0.06),
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                  },
                  fontWeight: isSelected(item.path) ? 600 : 500,
                  transition: 'all 0.2s ease-in-out',
                  boxShadow: isSelected(item.path) ? '0 4px 12px rgba(25, 118, 210, 0.2)' : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: isSelected(item.path) ? '3px' : '0px',
                    backgroundColor: theme.palette.primary.main,
                    transition: 'height 0.2s ease-in-out'
                  }
                }}
              >
                {item.text}
              </Button>
            ))}
          </Box>

          {/* Right side - User greeting and avatar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* User greeting - hidden on mobile */}
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              flexDirection: 'column', 
              alignItems: 'flex-end',
              background: alpha(theme.palette.primary.main, 0.06),
              padding: '8px 16px',
              borderRadius: '12px',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}>
              <Typography variant="body1" fontWeight="medium" color="text.primary">
                Hello, {userName} 👋
              </Typography>
             
            </Box>
            
            {/* User avatar and menu */}
            <IconButton 
              onClick={handleMenuOpen} 
              sx={{ 
                p: 0.5,
                border: `2px solid ${alpha(currentRoleConfig.color, 0.2)}`,
                borderRadius: '50%',
                transition: 'all 0.2s ease',
                '&:hover': {
                  border: `2px solid ${alpha(currentRoleConfig.color, 0.4)}`,
                  transform: 'scale(1.05)'
                }
              }}
            >
              <Avatar
                sx={{
                  bgcolor: currentRoleConfig.color,
                  width: 42,
                  height: 42,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                {currentRoleConfig.icon}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 220,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  borderRadius: 3,
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                 
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: currentRoleConfig.color,
                      mr: 1
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {currentRoleConfig.label}
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ 
                py: 1.5, 
                color: "#d32f2f",
                '&:hover': {
                  backgroundColor: alpha('#d32f2f', 0.08)
                }
              }}>
                <LogoutIcon sx={{ mr: 1.5, color: "#d32f2f" }} />
                <Typography variant="body1">Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          background: "linear-gradient(135deg, #f0f5ff 0%, #e3f2fd 100%)",
          minHeight: "calc(100vh - 80px)",
        }}
      >
        <Paper
          sx={{
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            overflow: "hidden",
            background: "white",
            minHeight: "400px",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}
        >
          <Outlet />
        </Paper>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 3,
          bgcolor: "white",
          borderTop: `1px solid ${theme.palette.divider}`,
          textAlign: "center",
          background: "linear-gradient(90deg, #ffffff 0%, #f8fbff 100%)",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} SkyLounge Airline Management System
        </Typography>
      </Box>
    </Box>
  );
}