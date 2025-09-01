import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth"; // <-- your login function

// Background
import background from "../assets/curve.png";

export default function FlightLoginFancy() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();
  const downMd = useMediaQuery(theme.breakpoints.down("md"));
  const downSm = useMediaQuery(theme.breakpoints.down("sm"));

  const ART_SIZE = downSm ? 96 : downMd ? 118 : 140;

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      const data = await login(email, password); // { token, user }
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify({
        role: data.role,
        name: data.name,
        email: data.email,
      }));
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: `url(${background}) no-repeat center center/cover`,
        padding: 3,
      }}
    >
      {/* Login Card */}
      <Box sx={{ maxWidth: 500, width: "100%", padding: 4, borderRadius: 5 }}>
        <Paper
          elevation={8}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 3,
            borderRadius: 3,
            backdropFilter: "blur(8px)",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.5)",
            backgroundColor: "#eaf5f4ff",
          }}
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            align="center"
            gutterBottom
            sx={{
              color: '#00796b',
              fontFamily: "'Poppins', sans-serif",
              fontSize: "1.75rem",
            }}
          >
            Login to Your Account
          </Typography>

          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="outlined"
            InputLabelProps={{
              style: { color: theme.palette.text.primary },
            }}
            sx={{
              backgroundColor: "#f8f8f8",
              borderRadius: 2,
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: theme.palette.secondary.main,
                },
              },
            }}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            InputLabelProps={{
              style: { color: theme.palette.text.primary },
            }}
            sx={{
              backgroundColor: "#f8f8f8",
              borderRadius: 2,
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: theme.palette.secondary.main,
                },
              },
            }}
          />

          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 1, fontSize: "0.875rem" }}>
              {error}
            </Typography>
          )}

          <Button
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              mt: 2.5,
              py: 1.5,
              fontWeight: 600,
              background: "linear-gradient(45deg, #00796b, #004d40)",
              borderRadius: 2,
              "&:hover": {
                background: "linear-gradient(45deg, #004d40, #00796b)",
              },
            }}
            onClick={handleLogin}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>

          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 3, fontSize: "0.875rem", color: "#6c757d" }}
          >
            Don't have an account?{" "}
            <Typography
              component="span"
              sx={{
                color: "#00796b",
                fontWeight: "bold",
                cursor: "pointer",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
              onClick={() => {
                sessionStorage.setItem('isNavigation', 'true');
                navigate("/register");
              }}
            >
              Register here
            </Typography>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
