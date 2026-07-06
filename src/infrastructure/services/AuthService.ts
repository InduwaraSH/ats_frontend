import type { IAuthService } from '../../application/services/IAuthService';
import type { User } from '../../domain/entities/User';

export class AuthService implements IAuthService {
  private API_BASE_URL = 'http://localhost:8000/api/v1';

  async login(email: string, password: string): Promise<User> {
    // 1. Post to login endpoint
    const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = 'Invalid email or password';
      try {
        const errData = await response.json();
        if (errData?.detail) {
          errorMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
        }
      } catch {
        // use default error message if parsing fails
      }
      throw new Error(errorMessage);
    }

    // 2. Fetch user profile (me) using the cookie set by the server
    const meResponse = await fetch(`${this.API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!meResponse.ok) {
      throw new Error('Failed to retrieve user profile after login.');
    }

    const userData = await meResponse.json();

    // Map backend user response to frontend User model
    return {
      id: userData.id,
      email: userData.email,
      name: userData.full_name,
      role: userData.role === 'admin' ? 'admin' : 'recruiter',
    };
  }

  async logout(): Promise<void> {
    await fetch(`${this.API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const userData = await response.json();

      return {
        id: userData.id,
        email: userData.email,
        name: userData.full_name,
        role: userData.role === 'admin' ? 'admin' : 'recruiter',
      };
    } catch {
      return null;
    }
  }
}
