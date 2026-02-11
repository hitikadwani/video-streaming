import { Request, Response } from 'express';
export declare function register(req: Request, res: Response): Promise<void>;
export declare function login(req: Request, res: Response): Promise<void>;
export declare function logout(req: Request, res: Response): Promise<void>;
export declare function getCurrentUser(req: Request, res: Response): Promise<void>;
export declare function googleAuth(req: Request, res: Response): void;
export declare function googleCallback(req: Request, res: Response): Promise<void>;
export declare function githubAuth(req: Request, res: Response): void;
export declare function githubCallback(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=authController.d.ts.map