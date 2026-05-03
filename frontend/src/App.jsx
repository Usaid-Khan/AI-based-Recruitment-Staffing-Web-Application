import { Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import CandidateDashboard from './pages/candidate/CandidateDashboard'
import CandidateProfile from './pages/candidate/CandidateProfile'
import MyApplications from './pages/candidate/MyApplications'
import BrowseVacancies from './pages/candidate/BrowseVacancies'
import EmployerDashboard from './pages/employer/EmployerDashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
      <Route path="/candidate/profile" element={<CandidateProfile />} />
      <Route path="/candidate/applications" element={<MyApplications />} />
      <Route path="/candidate/vacancies" element={<BrowseVacancies />} />
      <Route path="/employer/dashboard" element={<EmployerDashboard />} />
    </Routes>
  )
}

export default App
