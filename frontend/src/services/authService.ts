import api from './api'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name?: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface User {
  id: string
  email: string
  full_name?: string
  is_active: boolean
}

const TOKEN_KEY = 'crewai_token'

export const authService = {
  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  /**
   * Store token
   */
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },

  /**
   * Remove token
   */
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY)
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken()
  },

  /**
   * Login
   */
  async login(request: LoginRequest): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/login', request)
    this.setToken(response.data.access_token)
    return response.data
  },

  /**
   * Register
   */
  async register(request: RegisterRequest): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/register', request)
    this.setToken(response.data.access_token)
    return response.data
  },

  /**
   * Get current user
   */
  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    return response.data
  },

  /**
   * Logout
   */
  logout(): void {
    this.removeToken()
    window.location.href = '/login'
  },

  /**
   * Refresh token
   */
  async refreshToken(): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/refresh')
    this.setToken(response.data.access_token)
    return response.data
  },
}
