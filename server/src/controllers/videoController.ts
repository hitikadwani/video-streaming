import { Request, Response } from "express";
import { videoQueries, tagQueries } from "../db/queries";
import path from "path";
import fs from 'fs';

export async function getAllVideos(req: Request, res: Response): Promise<void> {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        const videos = await videoQueries.getAll(limit, offset);

        res.json({ videos, count: videos.length});
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({error: 'Failed to fetch videos'});
    }
}

export async function getVideoById(req: Request, res: Response): Promise<void> {
    try {
        const idParam = req.params.id;
        const id = Array.isArray(idParam) ? parseInt(idParam[0]) : parseInt(idParam);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid video id' });
            return;
        }
        const video = await videoQueries.getById(id);
        if (!video) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }
        res.json({ video });
    } catch (error) {
        console.error('Error fetching video by id:', error);
        res.status(500).json({error: 'Failed to fetch video by id'});
    }
}

export async function searchVideos(req: Request, res: Response): Promise<void> {
    try {
        const { q, tags } = req.query;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        let videos;

        if(q && tags) {
            const tagsIds = (tags as string).split(',').map(tag => parseInt(tag));
            videos = await videoQueries.searchAndFilter(q as string, tagsIds, limit, offset);
        } else if(q) {
            videos = await videoQueries.search(q as string, limit, offset);
        } else if (tags) {
            const tagsIds = (tags as string).split(',').map(tag => parseInt(tag));
            videos = await videoQueries.filterByTags(tagsIds, limit, offset);
        } else {
            videos = await videoQueries.getAll(limit, offset);
        }

        res.json({ videos, count: videos.length});
    } catch (error) {
        console.error('Error searching videos:', error);
        res.status(500).json({error: 'Failed to search videos'});
    }
}

export async function streamVideo(req: Request, res: Response): Promise<void> {
    try {
        const idParam = req.params.id;
        const id = Array.isArray(idParam) ? parseInt(idParam[0]) : parseInt(idParam);
        if(isNaN(id)) {
            res.status(400).json({ error: 'Invalid video id' });
            return;
        }

        const video = await videoQueries.getById(id);
        if(!video) {
            res.status(404).json({error: 'Video not found'});
            return;
        }

        const manifestPath = path.join(__dirname, '../../public', video.manifest_url);

        if(!fs.existsSync(manifestPath)) {
            res.status(404).json({error: 'Video manifest not found'});
            return;
        }
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

        res.sendFile(manifestPath);
    } catch(error) {
        console.error('Error streaming video:', error);
        res.status(500).json({error: 'Failed to stream video'});
    }
}

export async function getAllTags(req: Request, res: Response): Promise<void> {
    try {
        const tags = await tagQueries.getAll();
        res.json({ tags });
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({error: 'Failed to fetch tags'});
    }
}