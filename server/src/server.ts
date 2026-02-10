import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction} from 'express';
import session from 'express-session';
// @ts-ignore
import pgSession from 'express-pg-session';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import pool from './config/database';


import authRoutes from './routes/authRoutes';
import videoRoutes from './routes/videoRoutes';
import tagRoutes from './routes/tagRoutes';


const app = express();
const PORT = process.env.PORT || 5000;

const PgSession = pgSession(session);

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
    store: new PgSession({
        pool: pool,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7*24 * 60 * 60 * 1000, // 7 days
    }
}));

app.use('/videos', express.static(path.join(__dirname, '../../public/videos')));
app.use('/thumbnails', express.static(path.join(__dirname, '../../public/thumbnails')));

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', msg: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/tags', tagRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});



app.listen(PORT, () =>{  
  console.log(`Server is running on port ${PORT}`)
});