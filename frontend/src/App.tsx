import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Pages
import Initialize from './pages/Initialize'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import TokenUsage from './pages/TokenUsage'
import Memory from './pages/Memory'
import ExecutionDetail from './pages/ExecutionDetail'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/initialize" element={<Initialize />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/token-usage" element={<TokenUsage />} />
          <Route path="/agents/:agentId/memory" element={<Memory />} />
          <Route path="/executions/:id" element={<ExecutionDetail />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App
