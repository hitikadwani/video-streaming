"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllVideos = getAllVideos;
exports.getVideoById = getVideoById;
exports.searchVideos = searchVideos;
exports.streamVideo = streamVideo;
exports.getAllTags = getAllTags;
const queries_1 = require("../db/queries");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
async function getAllVideos(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const videos = await queries_1.videoQueries.getAll(limit, offset);
        res.json({ videos, count: videos.length });
    }
    catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
}
async function getVideoById(req, res) {
    try {
        const idParam = req.params.id;
        const id = Array.isArray(idParam) ? parseInt(idParam[0]) : parseInt(idParam);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid video id' });
            return;
        }
        const video = await queries_1.videoQueries.getById(id);
        if (!video) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }
        res.json({ video });
    }
    catch (error) {
        console.error('Error fetching video by id:', error);
        res.status(500).json({ error: 'Failed to fetch video by id' });
    }
}
async function searchVideos(req, res) {
    try {
        const { q, tags } = req.query;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        let videos;
        if (q && tags) {
            const tagsIds = tags.split(',').map(tag => parseInt(tag));
            videos = await queries_1.videoQueries.searchAndFilter(q, tagsIds, limit, offset);
        }
        else if (q) {
            videos = await queries_1.videoQueries.search(q, limit, offset);
        }
        else if (tags) {
            const tagsIds = tags.split(',').map(tag => parseInt(tag));
            videos = await queries_1.videoQueries.filterByTags(tagsIds, limit, offset);
        }
        else {
            videos = await queries_1.videoQueries.getAll(limit, offset);
        }
        res.json({ videos, count: videos.length });
    }
    catch (error) {
        console.error('Error searching videos:', error);
        res.status(500).json({ error: 'Failed to search videos' });
    }
}
async function streamVideo(req, res) {
    try {
        const idParam = req.params.id;
        const id = Array.isArray(idParam) ? parseInt(idParam[0]) : parseInt(idParam);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid video id' });
            return;
        }
        const video = await queries_1.videoQueries.getById(id);
        if (!video) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }
        const manifestUrl = video.manifest_url;
        // External HLS URL (e.g. Unified Streaming, CDN) – redirect to it
        if (manifestUrl.startsWith('http://') || manifestUrl.startsWith('https://')) {
            res.redirect(302, manifestUrl);
            return;
        }
        // Local file – serve from disk
        const manifestPath = path_1.default.join(__dirname, '../../../public', manifestUrl);
        if (!fs_1.default.existsSync(manifestPath)) {
            res.status(404).json({ error: 'Video manifest not found' });
            return;
        }
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.sendFile(manifestPath);
    }
    catch (error) {
        console.error('Error streaming video:', error);
        res.status(500).json({ error: 'Failed to stream video' });
    }
}
async function getAllTags(req, res) {
    try {
        const tags = await queries_1.tagQueries.getAll();
        res.json({ tags });
    }
    catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
}
//# sourceMappingURL=videoController.js.map