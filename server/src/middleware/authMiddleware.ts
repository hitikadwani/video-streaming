import { Request, Response, NextFunction } from 'express';


export function requireAuth(req: Request,res: Response, next: NextFunction): void {
    if(req.session && req.session.userId) {
        return next();
    } 

    res.status(401).json({ error: 'Unauthorized. Please login to continue'});
}


export function redirectIfAuthenticated(req: Request,res: Response, next: NextFunction): void {
    if(req.session && req.session.userId) {
        res.status(400).json({ error: 'Already logged in'});
        return;
    }
    next();
}