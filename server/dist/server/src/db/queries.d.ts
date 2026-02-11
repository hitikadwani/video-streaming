import { User, Video, Tag, VideoCreateInput } from '../types';
export declare const userQueries: {
    createUser(email: string, passwordHash: string, display_name: string): Promise<User>;
    findByEmail(email: string): Promise<User>;
    findById(id: number): Promise<User>;
    findorCreateOAuthUser(provider: "google" | "github", oauthId: string, email: string, displayName: string): Promise<User>;
};
export declare const videoQueries: {
    getAll(limit?: number, offset?: number): Promise<Video[]>;
    getById(id: number): Promise<Video>;
    search(query: string, limit?: number, offset?: number): Promise<Video[]>;
    filterByTags(tagIds: number[], limit?: number, offset?: number): Promise<Video[]>;
    searchAndFilter(query: string, tagIds: number[], limit?: number, offset?: number): Promise<Video[]>;
    create(videoData: VideoCreateInput): Promise<Video>;
    addTag(videoId: number, tagId: number): Promise<void>;
};
export declare const tagQueries: {
    getAll(): Promise<Tag[]>;
    create(name: string, slug: string): Promise<Tag>;
    findByName(name: string): Promise<Tag | undefined>;
};
//# sourceMappingURL=queries.d.ts.map