import axios from 'axios';

export interface GitHubUserProfile {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
  name: string | null;
}

export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export class GitHubAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID || '';
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET || '';
    this.redirectUri = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/github/callback`;
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  getAuthorizationUrl(): string {
    const scope = 'user:email read:user';
    return `https://github.com/login/oauth/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=${encodeURIComponent(scope)}`;
  }

  async getAccessToken(code: string): Promise<string> {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (response.data.error) {
      throw new Error(`GitHub OAuth Error: ${response.data.error_description || response.data.error}`);
    }

    return response.data.access_token;
  }

  async getUserProfile(accessToken: string): Promise<{ profile: GitHubUserProfile; primaryEmail: string }> {
    const userRes = await axios.get<GitHubUserProfile>('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'DeployEasy-App',
      },
    });

    let primaryEmail = userRes.data.email || '';

    if (!primaryEmail) {
      try {
        const emailsRes = await axios.get<GitHubEmail[]>('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'DeployEasy-App',
          },
        });
        const primary = emailsRes.data.find((e) => e.primary && e.verified) || emailsRes.data[0];
        if (primary) primaryEmail = primary.email;
      } catch {
        // Fallback to placeholder if email scopes restricted
        primaryEmail = `${userRes.data.login}@users.noreply.github.com`;
      }
    }

    return { profile: userRes.data, primaryEmail };
  }
}

export const githubAuthService = new GitHubAuthService();
