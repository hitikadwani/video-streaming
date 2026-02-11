"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmail = validateEmail;
exports.validatePassword = validatePassword;
exports.validateDisplayName = validateDisplayName;
exports.sanitizeEmail = sanitizeEmail;
// Basic email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Password: min 8 chars, at least one letter and one number, NO special characters
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
// Display name: only letters, numbers, and spaces
const DISPLAY_NAME_REGEX = /^[A-Za-z0-9\s]+$/;
function validateEmail(email) {
    if (!email || typeof email !== 'string' || email.trim() === '') {
        return 'Please enter your email address';
    }
    if (email.length > 255) {
        return 'Email address is too long. Maximum 255 characters allowed';
    }
    if (!EMAIL_REGEX.test(email.trim())) {
        return 'Please enter a valid email address (e.g., you@example.com)';
    }
    return null;
}
function validatePassword(password) {
    if (!password || typeof password !== 'string' || password.trim() === '') {
        return 'Please enter your password';
    }
    if (password.length < 8) {
        return 'Password is too short. Use at least 8 characters';
    }
    if (password.length > 128) {
        return 'Password is too long. Maximum 128 characters allowed';
    }
    if (!/^[A-Za-z\d]+$/.test(password)) {
        return 'Password can only contain letters (A-Z) and numbers (0-9), no special characters';
    }
    if (!PASSWORD_REGEX.test(password)) {
        return 'Password must include at least one letter and one number';
    }
    return null;
}
function validateDisplayName(name) {
    if (!name)
        return null; // Optional
    if (typeof name !== 'string') {
        return 'Display name must be a valid text';
    }
    if (name.trim().length < 2) {
        return 'Display name is too short. Use at least 2 characters';
    }
    if (name.length > 50) {
        return 'Display name is too long. Maximum 50 characters allowed';
    }
    if (!DISPLAY_NAME_REGEX.test(name)) {
        return 'Display name can only contain letters, numbers, and spaces';
    }
    return null;
}
function sanitizeEmail(email) {
    return email.trim().toLowerCase();
}
//# sourceMappingURL=validation.js.map