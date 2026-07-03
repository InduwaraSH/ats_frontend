/**
 * Domain entity representing an authenticated user in the ATS system.
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'recruiter';
}
