import pool from '../config/database';
import { User, Video, Tag, VideoCreateInput } from '../types';

export const userQueries = {
    async createUser(email: string, passwordHash: string, display_name: string): Promise<User> {
        const result = await pool.query<User> (
            'INSERT into users (email, password_hash, display_name) values ($1, $2, $3) RETURNING *', [email, passwordHash, display_name]);
        return result.rows[0];
    },

    async findByEmail(email: string): Promise<User> {
        const result = await pool.query<User> (
            'SELECT * FROM users where email = $1', [email]
        );
        return result.rows[0];
    },

    async findById(id: number): Promise<User> {
        const result = await pool.query<User> (
            'SELECT * FROM users where id = $1', [id]
        );
        return result.rows[0];
    },

    async findorCreateOAuthUser(
        provider: 'google' | 'github',
        oauthId: string,
        email: string,
        displayName: string
    ): Promise<User> {
        let result = await pool.query<User> (
            'SELECT * FROM users where oauth_provider = $1 and oauth_id = $2', [provider, oauthId]
        );
        if(result.rows.length > 0) {
            return result.rows[0];
        }

        result = await pool.query<User> (
            'INSERT into users (email, oauth_provider, oauth_id, display_name) values ($1, $2, $3, $4) RETURNING *', [email, provider, oauthId, displayName]
        );
        return result.rows[0];
    }
};


export const videoQueries = {
    async getAll(limit: number = 20, offset: number = 0): Promise<Video[]> {
        const result = await pool.query<Video> (
            'SELECT * FROM videos ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]
        );
        return result.rows;
    },

    async getById(id: number): Promise<Video> {
        const videoResult = await pool.query<Video> (
            'SELECT * FROM videos where id = $1', [id]
        );
        if (videoResult.rows.length === 0) {
            throw new Error(`Video with id ${id} not found`);
        }

        const video = videoResult.rows[0];

        const tagsResult = await pool.query<Tag> (
            'SELECT t.* FROM tags t inner join video_tags vt on t.id = vt.tag_id where vt.video_id = $1', [id]
        );
        video.tags= tagsResult.rows;
        return video;
    },
   
    async search(query: string, limit: number = 20, offset: number = 0): Promise<Video[]> {
        const pattern = `%${query}%`;
        const result = await pool.query<Video>(
          `SELECT DISTINCT v.* FROM videos v
           LEFT JOIN video_tags vt ON v.id = vt.video_id
           LEFT JOIN tags t ON vt.tag_id = t.id
           WHERE v.title ILIKE $1 
              OR v.description ILIKE $1 
              OR t.name ILIKE $1 
              OR t.slug ILIKE $1
           ORDER BY v.created_at DESC
           LIMIT $2 OFFSET $3`,
          [pattern, limit, offset]
        );
        return result.rows;
    },

    async filterByTags(tagIds: number[], limit: number = 20, offset: number = 0): Promise<Video[]> {
        const result = await pool.query<Video>(
          `SELECT DISTINCT v.* FROM videos v
           INNER JOIN video_tags vt ON v.id = vt.video_id
           WHERE vt.tag_id = ANY($1)
           ORDER BY v.created_at DESC
           LIMIT $2 OFFSET $3`,
          [tagIds, limit, offset]
        );
        return result.rows;
    },

    async searchAndFilter(query: string, tagIds: number[], limit: number = 20, offset: number = 0): Promise<Video[]> {
        const pattern = `%${query}%`;
        const result = await pool.query<Video>(
          `SELECT DISTINCT v.* FROM videos v
           INNER JOIN video_tags vt ON v.id = vt.video_id
           LEFT JOIN tags t ON vt.tag_id = t.id
           WHERE vt.tag_id = ANY($1)
             AND (v.title ILIKE $2 OR v.description ILIKE $2 OR t.name ILIKE $2 OR t.slug ILIKE $2)
           ORDER BY v.created_at DESC
           LIMIT $3 OFFSET $4`,
          [tagIds, pattern, limit, offset]
        );
        return result.rows;
    },

    async create(videoData: VideoCreateInput): Promise<Video> {
        const { title, description, thumbnail_url, manifest_url, duration, external_provider, external_id, width, height } = videoData;
        const result = await pool.query<Video> (
            'INSERT into videos (title, description, thumbnail_url, manifest_url, duration, external_provider, external_id, width, height) values ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *', [title, description, thumbnail_url, manifest_url, duration, external_provider, external_id, width, height]
        );
        return result.rows[0];
    },

    async addTag(videoId: number, tagId: number): Promise<void> {
        await pool.query(
            'INSERT into video_tags (video_id, tag_id) values ($1, $2) ON CONFLICT DO NOTHING', [videoId, tagId]
        );
    }
};



export const tagQueries = {
    async getAll(): Promise<Tag[]> {
        const result = await pool.query<Tag> (
            'SELECT * FROM tags order by name ASC'
        );
        return result.rows;
    },

    async create(name: string, slug: string): Promise<Tag> {
        const result = await pool.query<Tag> (
            'INSERT into tags (name, slug) values ($1, $2) RETURNING *', [name, slug]
        );
        return result.rows[0];
    },

    async findByName(name: string): Promise<Tag | undefined> {
        const result = await pool.query<Tag> (
            'SELECT * FROM tags where name = $1', [name]
        );
        return result.rows[0];
    }
};

