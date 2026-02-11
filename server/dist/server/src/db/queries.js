"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagQueries = exports.videoQueries = exports.userQueries = void 0;
const database_1 = __importDefault(require("../config/database"));
exports.userQueries = {
    async createUser(email, passwordHash, display_name) {
        const result = await database_1.default.query('INSERT into users (email, password_hash, display_name) values ($1, $2, $3) RETURNING *', [email, passwordHash, display_name]);
        return result.rows[0];
    },
    async findByEmail(email) {
        const result = await database_1.default.query('SELECT * FROM users where email = $1', [email]);
        return result.rows[0];
    },
    async findById(id) {
        const result = await database_1.default.query('SELECT * FROM users where id = $1', [id]);
        return result.rows[0];
    },
    async findorCreateOAuthUser(provider, oauthId, email, displayName) {
        let result = await database_1.default.query('SELECT * FROM users where oauth_provider = $1 and oauth_id = $2', [provider, oauthId]);
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        result = await database_1.default.query('INSERT into users (email, oauth_provider, oauth_id, display_name) values ($1, $2, $3, $4) RETURNING *', [email, provider, oauthId, displayName]);
        return result.rows[0];
    }
};
exports.videoQueries = {
    async getAll(limit = 20, offset = 0) {
        const result = await database_1.default.query('SELECT * FROM videos ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
        return result.rows;
    },
    async getById(id) {
        const videoResult = await database_1.default.query('SELECT * FROM videos where id = $1', [id]);
        if (videoResult.rows.length === 0) {
            throw new Error(`Video with id ${id} not found`);
        }
        const video = videoResult.rows[0];
        const tagsResult = await database_1.default.query('SELECT t.* FROM tags t inner join video_tags vt on t.id = vt.tag_id where vt.video_id = $1', [id]);
        video.tags = tagsResult.rows;
        return video;
    },
    async search(query, limit = 20, offset = 0) {
        const pattern = `%${query}%`;
        const result = await database_1.default.query(`SELECT DISTINCT v.* FROM videos v
           LEFT JOIN video_tags vt ON v.id = vt.video_id
           LEFT JOIN tags t ON vt.tag_id = t.id
           WHERE v.title ILIKE $1 
              OR v.description ILIKE $1 
              OR t.name ILIKE $1 
              OR t.slug ILIKE $1
           ORDER BY v.created_at DESC
           LIMIT $2 OFFSET $3`, [pattern, limit, offset]);
        return result.rows;
    },
    async filterByTags(tagIds, limit = 20, offset = 0) {
        const result = await database_1.default.query(`SELECT DISTINCT v.* FROM videos v
           INNER JOIN video_tags vt ON v.id = vt.video_id
           WHERE vt.tag_id = ANY($1)
           ORDER BY v.created_at DESC
           LIMIT $2 OFFSET $3`, [tagIds, limit, offset]);
        return result.rows;
    },
    async searchAndFilter(query, tagIds, limit = 20, offset = 0) {
        const pattern = `%${query}%`;
        const result = await database_1.default.query(`SELECT DISTINCT v.* FROM videos v
           INNER JOIN video_tags vt ON v.id = vt.video_id
           LEFT JOIN tags t ON vt.tag_id = t.id
           WHERE vt.tag_id = ANY($1)
             AND (v.title ILIKE $2 OR v.description ILIKE $2 OR t.name ILIKE $2 OR t.slug ILIKE $2)
           ORDER BY v.created_at DESC
           LIMIT $3 OFFSET $4`, [tagIds, pattern, limit, offset]);
        return result.rows;
    },
    async create(videoData) {
        const { title, description, thumbnail_url, manifest_url, duration, external_provider, external_id, width, height } = videoData;
        const result = await database_1.default.query('INSERT into videos (title, description, thumbnail_url, manifest_url, duration, external_provider, external_id, width, height) values ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *', [title, description, thumbnail_url, manifest_url, duration, external_provider, external_id, width, height]);
        return result.rows[0];
    },
    async addTag(videoId, tagId) {
        await database_1.default.query('INSERT into video_tags (video_id, tag_id) values ($1, $2) ON CONFLICT DO NOTHING', [videoId, tagId]);
    }
};
exports.tagQueries = {
    async getAll() {
        const result = await database_1.default.query('SELECT * FROM tags order by name ASC');
        return result.rows;
    },
    async create(name, slug) {
        const result = await database_1.default.query('INSERT into tags (name, slug) values ($1, $2) RETURNING *', [name, slug]);
        return result.rows[0];
    },
    async findByName(name) {
        const result = await database_1.default.query('SELECT * FROM tags where name = $1', [name]);
        return result.rows[0];
    }
};
//# sourceMappingURL=queries.js.map