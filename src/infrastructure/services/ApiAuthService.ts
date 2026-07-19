import type { IAuthService } from '../../application/services/IAuthService';
import type { User } from '../../domain/entities/User';
import { apiLogin, apiGetMe, apiLogout, apiSignup } from '../api/authApi';

/**
 * Real implementation of IAuthService that communicates with the FastAPI backend.
 * Authentication is cookie-based: the backend sets/clears an HttpOnly cookie;
 * no token is stored in localStorage.
 */
export class ApiAuthService implements IAuthService {
  async login(email: string, password: string): Promise<User> {
    await apiLogin({ email, password }); // backend sets the HttpOnly cookie
    return this._fetchCurrentUser();
  }

  async signup(fullName: string, email: string, password: string, role: string): Promise<User> {
    const data = await apiSignup({ full_name: fullName, email, password, role });
    return {
      id: data.id,
      email: data.email,
      name: data.full_name,
      role: data.role as User['role'],
      is_active: data.is_active,
    };
  }



  async logout(): Promise<void> {
    await apiLogout(); // backend clears the HttpOnly cookie
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      return await this._fetchCurrentUser();
    } catch {
      // No active session (cookie missing or expired)
      return null;
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async _fetchCurrentUser(): Promise<User> {
    const data = await apiGetMe();
    return {
      id: data.id,
      email: data.email,
      name: data.full_name,
      role: data.role as User['role'],
      is_active: data.is_active,
    };
  }
}
