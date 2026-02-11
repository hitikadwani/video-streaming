"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.getCurrentUser = getCurrentUser;
exports.googleAuth = googleAuth;
exports.googleCallback = googleCallback;
exports.githubAuth = githubAuth;
exports.githubCallback = githubCallback;
const bcrypt_1 = __importDefault(require("bcrypt"));
const queries_1 = require("../db/queries");
const oauth_1 = require("../utils/oauth");
const validation_1 = require("../utils/validation");
async function register(req, res) {
    try {
        const { email, password, display_name } = req.body;
        // Validate email
        const emailErr = (0, validation_1.validateEmail)(email);
        if (emailErr) {
            res.status(400).json({ error: emailErr });
            return;
        }
        // Validate password
        const passErr = (0, validation_1.validatePassword)(password);
        if (passErr) {
            res.status(400).json({ error: passErr });
            return;
        }
        // Validate display name (optional)
        const nameErr = (0, validation_1.validateDisplayName)(display_name);
        if (nameErr) {
            res.status(400).json({ error: nameErr });
            return;
        }
        // Sanitize email
        const sanitizedEmail = (0, validation_1.sanitizeEmail)(email);
        // Check if user exists
        const existingUser = await queries_1.userQueries.findByEmail(sanitizedEmail);
        if (existingUser) {
            res.status(400).json({ error: 'This email is already registered. Please log in or use a different email.' });
            return;
        }
        // Hash password
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        // Create user
        const user = await queries_1.userQueries.createUser(sanitizedEmail, passwordHash, display_name?.trim() || sanitizedEmail.split('@')[0]);
        // Create session
        req.session.userId = user.id;
        req.session.user = {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
        };
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
            },
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed. Please try again later.' });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        // Validate email
        const emailErr = (0, validation_1.validateEmail)(email);
        if (emailErr) {
            res.status(400).json({ error: emailErr });
            return;
        }
        // Validate password exists
        if (!password || typeof password !== 'string' || password.trim() === '') {
            res.status(400).json({ error: 'Please enter your password' });
            return;
        }
        // Sanitize email
        const sanitizedEmail = (0, validation_1.sanitizeEmail)(email);
        // Find user
        const user = await queries_1.userQueries.findByEmail(sanitizedEmail);
        if (!user || !user.password_hash) {
            res.status(401).json({ error: 'Incorrect email or password. Please check your credentials and try again.' });
            return;
        }
        // Check password
        const validPassword = await bcrypt_1.default.compare(password, user.password_hash);
        if (!validPassword) {
            res.status(401).json({ error: 'Incorrect email or password. Please check your credentials and try again.' });
            return;
        }
        // Create session
        req.session.userId = user.id;
        req.session.user = {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
        };
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again later.' });
    }
}
async function logout(req, res) {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ error: 'Failed to logout' });
            return;
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful' });
    });
}
async function getCurrentUser(req, res) {
    try {
        if (!req.session.userId) {
            res.status(401).json({ error: 'You are not logged in. Please log in to continue.' });
            return;
        }
        const user = await queries_1.userQueries.findById(req.session.userId);
        if (!user) {
            res.status(404).json({ error: 'User account not found. Please log in again.' });
            return;
        }
        res.json({
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
            }
        });
    }
    catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ error: 'Unable to retrieve your account information. Please try again.' });
    }
}
function googleAuth(req, res) {
    const authUrl = oauth_1.googleOAuth.getAuthUrl();
    res.redirect(authUrl);
}
async function googleCallback(req, res) {
    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            res.redirect(`${process.env.CLIENT_URL}/login?error=no_code`);
            return;
        }
        const tokens = await oauth_1.googleOAuth.getTokens(code);
        const googleUser = await oauth_1.googleOAuth.getUserInfo(tokens.access_token);
        const user = await queries_1.userQueries.findorCreateOAuthUser('google', googleUser.id, googleUser.email, googleUser.name);
        req.session.userId = user.id;
        req.session.user = {
            id: user.id,
            email: user.email,
            displayName: user.display_name
        };
        res.redirect(`${process.env.CLIENT_URL}/`);
    }
    catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_error`);
    }
}
function githubAuth(req, res) {
    const authUrl = oauth_1.githubOAuth.getAuthUrl();
    res.redirect(authUrl);
}
// GitHub OAuth - Callback
async function githubCallback(req, res) {
    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            res.redirect(`${process.env.CLIENT_URL}/login?error=no_code`);
            return;
        }
        // Exchange code for access token
        const accessToken = await oauth_1.githubOAuth.getAccessToken(code);
        // Get user info
        const githubUser = await oauth_1.githubOAuth.getUserInfo(accessToken);
        // Find or create user
        const user = await queries_1.userQueries.findorCreateOAuthUser('github', githubUser.id.toString(), githubUser.email || `${githubUser.login}@github.user`, githubUser.name || githubUser.login);
        // Create session
        req.session.userId = user.id;
        req.session.user = {
            id: user.id,
            email: user.email,
            displayName: user.display_name
        };
        // Redirect to frontend
        res.redirect(`${process.env.CLIENT_URL}/`);
    }
    catch (error) {
        console.error('GitHub OAuth error:', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }
}
//# sourceMappingURL=authController.js.map