import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import FlightsPage from "./pages/FlightsPage";
import BaggagePage from "./pages/BaggagePage";
import OpsDashboard from './pages/OpsPage';
import Dashboard from './pages/DashboardPage';
import UserManagement from './pages/Userpage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Nested routes under HomePage */}
       <Route path="/home" element={<HomePage />}>
  <Route index element={<Dashboard />} /> {/* 👈 This is the fix */}
  <Route path="flights" element={<FlightsPage />} />
  <Route path="baggage" element={<BaggagePage />} />
  <Route path="operations" element={<OpsDashboard />} />
  <Route path="dashboard" element={<Dashboard />} />
  <Route path="users" element={<UserManagement />} />
</Route>
      </Routes>
    </Router>
  );
}

export default App;