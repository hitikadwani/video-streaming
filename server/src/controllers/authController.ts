import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { userQueries } from '../db/queries';
import { googleOAuth, githubOAuth } from '../utils/oauth';
import { validateEmail, validatePassword, validateDisplayName, sanitizeEmail } from '../utils/validation';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, display_name } = req.body;

    // Validate email
    const emailErr = validateEmail(email);
    if (emailErr) {
      res.status(400).json({ error: emailErr });
      return;
    }

    // Validate password
    const passErr = validatePassword(password);
    if (passErr) {
      res.status(400).json({ error: passErr });
      return;
    }

    // Validate display name (optional)
    const nameErr = validateDisplayName(display_name);
    if (nameErr) {
      res.status(400).json({ error: nameErr });
      return;
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Check if user exists
    const existingUser = await userQueries.findByEmail(sanitizedEmail);
    if (existingUser) {
      res.status(400).json({ error: 'This email is already registered. Please log in or use a different email.' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await userQueries.createUser(
      sanitizedEmail,
      passwordHash,
      display_name?.trim() || sanitizedEmail.split('@')[0]
    );

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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again later.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validate email
    const emailErr = validateEmail(email);
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
    const sanitizedEmail = sanitizeEmail(email);

    // Find user
    const user = await userQueries.findByEmail(sanitizedEmail);
    if (!user || !user.password_hash) {
      res.status(401).json({ error: 'Incorrect email or password. Please check your credentials and try again.' });
      return;
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again later.' });
  }
}



export async function logout(req: Request, res: Response): Promise<void> {
   req.session.destroy((err) => {
    if(err) {
        res.status(500).json({error: 'Failed to logout'});
        return;
    }
    res.clearCookie('connect.sid');
    res.json({message: 'Logout successful'});
   });
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
        if(!req.session.userId) {
            res.status(401).json({error: 'You are not logged in. Please log in to continue.'});
            return;
        }

        const user = await userQueries.findById(req.session.userId);
        if(!user) {
            res.status(404).json({error: 'User account not found. Please log in again.'});
            return;
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
            }
        });
    } catch(error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({error: 'Unable to retrieve your account information. Please try again.'});
    }
}

export function googleAuth(req: Request, res: Response): void {
    const authUrl = googleOAuth.getAuthUrl();
    res.redirect(authUrl);
}

export async function googleCallback(req: Request, res: Response): Promise<void> {
    try {
        const { code } = req.query;
        if(!code || typeof code!== 'string') {
            res.redirect(`${process.env.CLIENT_URL}/login?error=no_code`);
            return;
        }

        const tokens = await googleOAuth.getTokens(code);
        const googleUser = await googleOAuth.getUserInfo(tokens.access_token);

        const user = await userQueries.findorCreateOAuthUser('google', googleUser.id, googleUser.email, googleUser.name);

        req.session.userId = user.id;
        req.session.user = {
            id: user.id,
            email: user.email,
            displayName: user.display_name
        };

        res.redirect(`${process.env.CLIENT_URL}/`);

    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_error`);
    }
}

export function githubAuth(req: Request, res: Response): void {
    const authUrl = githubOAuth.getAuthUrl();
    res.redirect(authUrl);
  }
  
  // GitHub OAuth - Callback
  export async function githubCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.query;
  
      if (!code || typeof code !== 'string') {
        res.redirect(`${process.env.CLIENT_URL}/login?error=no_code`);
        return;
      }
  
      // Exchange code for access token
      const accessToken = await githubOAuth.getAccessToken(code);
      
      // Get user info
      const githubUser = await githubOAuth.getUserInfo(accessToken);
  
      // Find or create user
      const user = await userQueries.findorCreateOAuthUser(
        'github',
        githubUser.id.toString(),
        githubUser.email || `${githubUser.login}@github.user`,
        githubUser.name || githubUser.login
      );
  
      // Create session
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        email: user.email,
        displayName: user.display_name
      };
  
      // Redirect to frontend
      res.redirect(`${process.env.CLIENT_URL}/`);
  
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }
}