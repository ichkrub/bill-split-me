import { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  // Extend the base User type from Supabase if needed
}

export interface AuthSession {
  user: AuthUser | null;
  error: Error | null;
}

export interface AuthError {
  message: string;
  status?: number;
}