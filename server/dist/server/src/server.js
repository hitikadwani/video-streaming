"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const database_1 = __importDefault(require("./config/database"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const videoRoutes_1 = __importDefault(require("./routes/videoRoutes"));
const tagRoutes_1 = __importDefault(require("./routes/tagRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const PgSession = (0, connect_pg_simple_1.default)(express_session_1.default);
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, express_session_1.default)({
    store: new PgSession({
        pool: database_1.default,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    }
}));
// Resolve public folder path - works in both dev and production
// In dev: __dirname = server/src, so we go ../../public
// In prod: __dirname = server/dist/server/src, so we go ../../../../public
const publicPath = process.env.NODE_ENV === 'production'
    ? path_1.default.join(__dirname, '../../../../public')
    : path_1.default.join(__dirname, '../../public');
console.log('📁 Public folder path:', publicPath);
console.log('📁 __dirname:', __dirname);
app.use('/videos', express_1.default.static(path_1.default.join(publicPath, 'videos')));
app.use('/thumbnails', express_1.default.static(path_1.default.join(publicPath, 'thumbnails')));
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', msg: 'Server is running' });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/videos', videoRoutes_1.default);
app.use('/api/tags', tagRoutes_1.default);
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map