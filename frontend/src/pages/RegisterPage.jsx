import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Same background curve
import background from "../assets/curve.png";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const theme = useTheme();
  const downMd = useMediaQuery(theme.breakpoints.down("md"));
  const downSm = useMediaQuery(theme.breakpoints.down("sm"));

  const ART_SIZE = downSm ? 96 : downMd ? 118 : 140;

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    if (!name || !email || !password) {
      setError("Please fill all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/register-user`,
        { name, email, password, role: "user" }
      );

      setSuccess("User registered successfully! Redirecting to login...");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.errors) {
        setError(err.response.data.errors.map((e) => e.msg).join(", "));
      } else {
        setError("Registration failed. Try again.");
      }
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
      {/* Register Card */}
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
            Create Your Account
          </Typography>

          <TextField
            label="Full Name"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            label="Email"
            type="email"
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
          {success && (
            <Typography variant="body2" color="success.main" sx={{ mt: 1, fontSize: "0.875rem" }}>
              {success}
            </Typography>
          )}

          <Button
            variant="contained"
            fullWidth
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
            onClick={handleRegister}
          >
            Register Now
          </Button>

          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 3, fontSize: "0.875rem", color: "#6c757d" }}
          >
            Already have an account?{" "}
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
              onClick={() => navigate("/")}
            >
              Sign in here
            </Typography>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
