export interface Integration {
  userId: string;
  username: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  profileUrl?: string;
  connectedAt: Date;
  lastSyncAt?: Date;
  isActive: boolean;
  syncStatus: 'idle' | 'syncing' | 'completed' | 'failed';
  syncProgress?: {
    current: number;
    total: number;
    message: string;
  };
  metadata?: {
    totalRepos: number;
    totalCommits: number;
    totalIssues: number;
    totalPulls: number;
    totalUsers: number;
    organizations: Organization[];
  };
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    reset: Date;
    used: number;
  };
  needsSync?: boolean;
}

export interface Organization {
  id: number;
  login: string;
  name: string;
  syncedAt?: Date;
}

export interface IntegrationStatus {
  connected: boolean;
  message?: string;
  username?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  connectedAt?: Date;
  lastSyncAt?: Date;
  syncStatus?: 'idle' | 'syncing' | 'completed' | 'failed';
  needsSync?: boolean;
  metadata?: {
    totalRepos: number;
    totalCommits: number;
    totalIssues: number;
    totalPulls: number;
    organizations: Organization[];
  };
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    reset: Date;
    used: number;
  };
}

export interface AuthResponse {
  token: string;
  user: {
    userId: string;
    username: string;
    email?: string;
  };
}

export interface OAuthInitResponse {
  authUrl: string;
}