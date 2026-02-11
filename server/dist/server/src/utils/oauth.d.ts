import { GoogleUserInfo, GitHubUserInfo, GoogleTokenResponse } from '../types';
export declare const googleOAuth: {
    getAuthUrl(): string;
    getTokens(code: string): Promise<GoogleTokenResponse>;
    getUserInfo(accessToken: string): Promise<GoogleUserInfo>;
};
export declare const githubOAuth: {
    getAuthUrl(): string;
    getAccessToken(code: string): Promise<string>;
    getUserInfo(accessToken: string): Promise<GitHubUserInfo>;
};
//# sourceMappingURL=oauth.d.ts.map