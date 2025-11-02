/**
 * User model
 */
export interface User {
  userId: string;
  username: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  profileUrl?: string;
}

/**
 * Authenticated user with token
 */
export interface AuthenticatedUser extends User {
  token: string;
}

/**
 * User data stored in storage
 */
export interface StoredUserData {
  userId: string;
  username: string;
  email?: string;
}
