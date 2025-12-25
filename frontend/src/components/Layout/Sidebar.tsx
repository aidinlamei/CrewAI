import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Wrench,
  Brain,
  Play,
  FileText,
  Settings,
  BarChart3,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import clsx from 'clsx'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/executions', icon: Play, label: 'Executions' },
  { path: '/tools', icon: Wrench, label: 'Tools' },
  { path: '/llm-providers', icon: Brain, label: 'LLM Providers' },
  { path: '/templates', icon: FileText, label: 'Templates' },
  { path: '/token-usage', icon: BarChart3, label: 'Token Usage' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-40',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {!sidebarCollapsed && (
          <Link to="/" className="flex items-center gap-2">
            <Database className="w-8 h-8 text-primary" />
            <span className="font-bold text-lg">CrewAI</span>
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Menu */}
      <nav className="mt-4 px-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Version */}
      {!sidebarCollapsed && (
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="text-xs text-gray-500 text-center">
            CrewAI Manager v1.0.0
          </div>
        </div>
      )}
    </aside>
  )
}
