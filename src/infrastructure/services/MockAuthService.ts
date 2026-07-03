import type { IAuthService } from '../../application/services/IAuthService';
import type { User } from '../../domain/entities/User';

/**
 * Mock implementation of IAuthService.
 * Simulates authentication logic using localStorage and a local delay.
 */
export class MockAuthService implements IAuthService {
  private STORAGE_KEY = 'ats_user_session';

  /**
   * Simulates credentials validation.
   */
  async login(email: string, password: string): Promise<User> {
    // Artificial latency for realism
    await new Promise((resolve) => setTimeout(resolve, 800));

    const normalizedEmail = email.trim().toLowerCase();
    
    // Validate credentials against user requirements
    if (normalizedEmail === 'admin@ats.com' && password === '123456') {
      const user: User = {
        id: 'usr_admin_01',
        email: normalizedEmail,
        name: 'ATS Admin Administrator',
        role: 'admin',
      };
      
      // Store session locally
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      return user;
    }

    throw new Error('Invalid email or password. Please use admin@ats.com and 123456.');
  }

  /**
   * Clears session storage.
   */
  async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Retrieves active session details.
   */
  async getCurrentUser(): Promise<User | null> {
    const sessionData = localStorage.getItem(this.STORAGE_KEY);
    if (!sessionData) return null;
    
    try {
      return JSON.parse(sessionData) as User;
    } catch {
      localStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }
}
