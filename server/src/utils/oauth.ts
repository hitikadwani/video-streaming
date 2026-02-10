import axios from 'axios';
import { GoogleUserInfo, GitHubUserInfo, GoogleTokenResponse, } from '../types';

export const googleOAuth = {
    getAuthUrl(): string{
        const params = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'consent'
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    },

    async getTokens(code: string): Promise<GoogleTokenResponse> {
        const response = await axios.post<GoogleTokenResponse>('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code'
        });
        return response.data;
    },

    async getUserInfo(accessToken: string): Promise<GoogleUserInfo>{
        const response = await axios.get<GoogleUserInfo>('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return response.data;
    }
};


export const githubOAuth = {
    // Get authorization URL
    getAuthUrl(): string {
      const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: process.env.GITHUB_REDIRECT_URI,
        scope: 'user:email'
      });
      return `https://github.com/login/oauth/authorize?${params}`;
    },
  
    // Exchange code for access token
    async getAccessToken(code: string): Promise<string> {
      const response = await axios.post<{ access_token: string }>(
        'https://github.com/login/oauth/access_token',
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: process.env.GITHUB_REDIRECT_URI
        },
        {
          headers: { Accept: 'application/json' }
        }
      );
      return response.data.access_token;
    },
  
    // Get user info from GitHub
    async getUserInfo(accessToken: string): Promise<GitHubUserInfo> {
      const response = await axios.get<GitHubUserInfo>('https://api.github.com/user', {
        headers: { 
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      return response.data;
    }
};