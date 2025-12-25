import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

// Pages
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
            {/* Initialize (no layout) */}
            <Route path="/initialize" element={<Initialize />} />
            
            {/* Main Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/:projectId/agents" element={<Agents />} />
            <Route path="/projects/:projectId/tasks" element={<Tasks />} />
            <Route path="/projects/:projectId/flow" element={<FlowDesigner />} />
            
            {/* Tools & Providers */}
            <Route path="/tools" element={<Tools />} />
            <Route path="/llm-providers" element={<LLMProviders />} />
            
            {/* Executions */}
            <Route path="/executions" element={<Executions />} />
            <Route path="/executions/:id" element={<ExecutionDetail />} />
            
            {/* Other */}
            <Route path="/templates" element={<Templates />} />
            <Route path="/token-usage" element={<TokenUsage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/agents/:agentId/memory" element={<Memory />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App
