// Simple authentication utility
import { createError } from 'h3';

export function requireAuth(event: any) {
  // Example: check for user session or token
  const user = event.context?.user;
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Authentication required' });
  return user;
}
