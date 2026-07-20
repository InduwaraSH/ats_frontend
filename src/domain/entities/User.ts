/**
 * Domain entity representing an authenticated user in the ATS system.
 * Roles mirror the backend constraint: admin | recruiter | hiring_manager | interviewer.
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'recruiter' | 'hiring_manager' | 'interviewer' | 'user';
  is_active: boolean;
}
