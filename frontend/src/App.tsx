import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

// Auth
import { authService } from '@/services/authService'

// Pages
import Login from './pages/Login'
import Initialize from './pages/Initialize'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Agents from './pages/Agents'
import Tasks from './pages/Tasks'
import Tools from './pages/Tools'
import LLMProviders from './pages/LLMProviders'
import Executions from './pages/Executions'
import ExecutionDetail from './pages/ExecutionDetail'
import Templates from './pages/Templates'
import TokenUsage from './pages/TokenUsage'
import Settings from './pages/Settings'
import FlowDesigner from './pages/FlowDesigner'
import Memory from './pages/Memory'

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/initialize" element={<Initialize />} />
            
            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
            <Route path="/projects/:projectId/agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
            <Route path="/projects/:projectId/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/projects/:projectId/flow" element={<ProtectedRoute><FlowDesigner /></ProtectedRoute>} />
            
            {/* Tools & Providers */}
            <Route path="/tools" element={<ProtectedRoute><Tools /></ProtectedRoute>} />
            <Route path="/llm-providers" element={<ProtectedRoute><LLMProviders /></ProtectedRoute>} />
            
            {/* Executions */}
            <Route path="/executions" element={<ProtectedRoute><Executions /></ProtectedRoute>} />
            <Route path="/executions/:id" element={<ProtectedRoute><ExecutionDetail /></ProtectedRoute>} />
            
            {/* Other */}
            <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            <Route path="/token-usage" element={<ProtectedRoute><TokenUsage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/agents/:agentId/memory" element={<ProtectedRoute><Memory /></ProtectedRoute>} />
            
            {/* Redirect unknown routes to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App
