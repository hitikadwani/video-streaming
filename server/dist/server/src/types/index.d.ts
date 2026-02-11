export interface User {
    id: number;
    email: string;
    password_hash: string | null;
    oauth_provider: 'google' | 'github' | null;
    oauth_id: string | null;
    display_name: string | null;
    created_at: Date;
    updated_at: Date;
}
export interface UserSession {
    id: number;
    email: string;
    displayName: string | null;
}
export interface Video {
    id: number;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    manifest_url: string;
    duration: number | null;
    external_provider: string | null;
    external_id: string | null;
    width: number | null;
    height: number | null;
    created_at: Date;
    updated_at: Date;
    tags?: Tag[];
}
export interface VideoCreateInput {
    title: string;
    description?: string;
    thumbnail_url?: string;
    manifest_url: string;
    duration?: number;
    external_provider?: string;
    external_id?: string;
    width?: number;
    height?: number;
}
export interface Tag {
    id: number;
    name: string;
    slug: string;
    created_at: Date;
}
export interface GoogleUserInfo {
    id: string;
    email: string;
    name: string;
    picture?: string;
}
export interface GitHubUserInfo {
    id: number;
    login: string;
    email: string | null;
    name: string | null;
    avatar_url?: string;
}
export interface GoogleTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
}
export interface PexelsVideo {
    id: number;
    width: number;
    height: number;
    duration: number;
    image: string;
    user: {
        name: string;
    };
    video_files: Array<{
        id: number;
        quality: string;
        file_type: string;
        width: number;
        height: number;
        link: string;
    }>;
    video_pictures: Array<{
        id: number;
        picture: string;
        nr: number;
    }>;
}
export interface VideoMetadata {
    pexels_id: number;
    title: string;
    description: string;
    duration: number;
    width: number;
    height: number;
    thumbnail: string;
    video_file: string;
    manifest_url?: string;
    tags: string[];
}
declare module 'express-session' {
    interface SessionData {
        userId: number;
        user: UserSession;
    }
}
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DATABASE_URL: string;
            PORT: string;
            NODE_ENV: 'development' | 'production';
            SESSION_SECRET: string;
            PEXELS_API_KEY: string;
            GOOGLE_CLIENT_ID: string;
            GOOGLE_CLIENT_SECRET: string;
            GOOGLE_REDIRECT_URI: string;
            GITHUB_CLIENT_ID: string;
            GITHUB_CLIENT_SECRET: string;
            GITHUB_REDIRECT_URI: string;
            CLIENT_URL: string;
        }
    }
}
export {};
//# sourceMappingURL=index.d.ts.map