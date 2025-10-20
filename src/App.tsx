import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProjectBuilder from './pages/ProjectBuilder'
import MemberArea from './pages/MemberArea'
import MemberLogin from './pages/MemberLogin'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/project/:id" element={<ProjectBuilder />} />
        <Route path="/member/:id/login" element={<MemberLogin />} />
        <Route path="/member/:id/area" element={<MemberArea />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  )
}

export default App