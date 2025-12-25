import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useUIStore } from '@/stores/uiStore'
import clsx from 'clsx'

interface MainLayoutProps {
  children: ReactNode
  title?: string
}

export default function MainLayout({ children, title }: MainLayoutProps) {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar title={title} />
      
      <main
        className={clsx(
          'pt-16 min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'pl-16' : 'pl-64'
        )}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
