"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubOAuth = exports.googleOAuth = void 0;
const axios_1 = __importDefault(require("axios"));
exports.googleOAuth = {
    getAuthUrl() {
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
    async getTokens(code) {
        const response = await axios_1.default.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code'
        });
        return response.data;
    },
    async getUserInfo(accessToken) {
        const response = await axios_1.default.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return response.data;
    }
};
exports.githubOAuth = {
    // Get authorization URL
    getAuthUrl() {
        const params = new URLSearchParams({
            client_id: process.env.GITHUB_CLIENT_ID,
            redirect_uri: process.env.GITHUB_REDIRECT_URI,
            scope: 'user:email'
        });
        return `https://github.com/login/oauth/authorize?${params}`;
    },
    // Exchange code for access token
    async getAccessToken(code) {
        const response = await axios_1.default.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: process.env.GITHUB_REDIRECT_URI
        }, {
            headers: { Accept: 'application/json' }
        });
        return response.data.access_token;
    },
    // Get user info from GitHub
    async getUserInfo(accessToken) {
        const response = await axios_1.default.get('https://api.github.com/user', {
            headers: {
                Authorization: `token ${accessToken}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });
        return response.data;
    }
};
//# sourceMappingURL=oauth.js.map