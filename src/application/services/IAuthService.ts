import type { User } from '../../domain/entities/User';

/**
 * Authentication service interface.
 * Defines the contract for user sign-in, registration, session verification, and sign-out.
 */
export interface IAuthService {
  /**
   * Authenticates a user with email and password.
   */
  login(email: string, password: string): Promise<User>;

  /**
   * Ends the current user session.
   */
  logout(): Promise<void>;

  /**
   * Retrieves the currently active user session, if any.
   */
  getCurrentUser(): Promise<User | null>;
}
