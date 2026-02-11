"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.redirectIfAuthenticated = redirectIfAuthenticated;
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized. Please login to continue' });
}
function redirectIfAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        res.status(400).json({ error: 'Already logged in' });
        return;
    }
    next();
}
//# sourceMappingURL=authMiddleware.js.map