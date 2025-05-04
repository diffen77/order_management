/**
 * Authentication related types.
 */

/**
 * User session interface
 */
export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}

/**
 * User roles in the system
 */
export type UserRole = 'admin' | 'producer' | 'staff';

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  companyName?: string;
}

/**
 * Authentication context state
 */
export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * User profile information
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyName?: string;
  createdAt: string;
  avatarUrl?: string;
}

/**
 * Authentication context value
 */
export interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
} 