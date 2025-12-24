import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/services/api'

export default function Initialize() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    checkInitialization()
  }, [])

  const checkInitialization = async () => {
    try {
      const response = await api.get('/initialize/status')
      setIsInitialized(response.data.is_initialized)

      if (response.data.is_initialized) {
        toast.success('System already initialized')
        setTimeout(() => navigate('/'), 1500)
      }
    } catch (error) {
      console.error('Failed to check initialization status:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleInitialize = async () => {
    setLoading(true)
    try {
      const response = await api.post('/initialize')

      if (response.data.success) {
        toast.success(response.data.message)
        setTimeout(() => navigate('/'), 1500)
      } else {
        toast.error(response.data.message)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Initialization failed')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking system status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">CrewAI Manager</h1>
            <p className="text-gray-600 mb-8">Initialize your system to get started</p>

            {!isInitialized ? (
              <>
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      This will set up:
                    </p>
                    <ul className="text-sm text-blue-700 mt-2 text-left list-disc list-inside">
                      <li>Database tables and indexes</li>
                      <li>Default tools (Web search, Wikipedia, etc.)</li>
                      <li>Project templates</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={handleInitialize}
                  disabled={loading}
                  className="w-full btn btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Initializing...
                    </div>
                  ) : (
                    'Initialize System'
                  )}
                </button>
              </>
            ) : (
              <div className="text-center">
                <div className="text-green-600 text-5xl mb-4">✓</div>
                <p className="text-gray-700">System is already initialized!</p>
                <p className="text-gray-500 text-sm mt-2">Redirecting to dashboard...</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          CrewAI Manager v1.0.0
        </p>
      </div>
    </div>
  )
}
