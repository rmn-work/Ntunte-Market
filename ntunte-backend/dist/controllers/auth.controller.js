"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeController = exports.loginController = exports.registerController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const JWT_SECRET = process.env.JWT_SECRET || 'ntunte_dev_secret_key_2026';
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
};
const registerController = async (req, res) => {
    try {
        const { username, email, password, phone } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Le pseudo, l’e-mail et le mot de passe sont obligatoires.',
            });
        }
        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Le mot de passe doit contenir au moins 6 caractères.',
            });
        }
        const existing = await database_1.pool.query(`SELECT username, email FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = $2`, [cleanUsername, cleanEmail]);
        if (existing.rows.length > 0) {
            const taken = existing.rows[0];
            const conflictMsg = taken.email.toLowerCase() === cleanEmail
                ? 'Cet e-mail est déjà utilisé.'
                : 'Ce pseudo est déjà pris.';
            return res.status(409).json({ success: false, message: conflictMsg });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const insertRes = await database_1.pool.query(`INSERT INTO users (username, email, password_hash, phone, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, username, email, phone, created_at`, [cleanUsername, cleanEmail, passwordHash, phone?.trim() || null]);
        const newUser = insertRes.rows[0];
        const token = generateToken(newUser);
        return res.status(201).json({
            success: true,
            message: 'Compte créé avec succès !',
            token,
            user: newUser,
        });
    }
    catch (error) {
        console.error('Erreur inscription:', error);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de l’inscription.' });
    }
};
exports.registerController = registerController;
const loginController = async (req, res) => {
    try {
        const { identifier, email, password } = req.body;
        const loginId = (identifier || email || '').trim();
        if (!loginId || !password) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez entrer votre e-mail (ou pseudo) et votre mot de passe.',
            });
        }
        const userRes = await database_1.pool.query(`SELECT id, username, email, phone, password_hash FROM users
       WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)`, [loginId]);
        if (userRes.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Identifiants incorrects.' });
        }
        const user = userRes.rows[0];
        if (!user.password_hash) {
            return res.status(401).json({
                success: false,
                message: 'Ce compte n’a pas encore de mot de passe configuré.',
            });
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Identifiants incorrects.' });
        }
        const token = generateToken(user);
        return res.status(200).json({
            success: true,
            message: 'Connexion réussie !',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone,
            },
        });
    }
    catch (error) {
        console.error('Erreur connexion:', error);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la connexion.' });
    }
};
exports.loginController = loginController;
const getMeController = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Non autorisé.' });
        }
        const userRes = await database_1.pool.query(`SELECT id, username, email, phone, created_at FROM users WHERE id = $1`, [req.user.id]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
        }
        return res.status(200).json({ success: true, user: userRes.rows[0] });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMeController = getMeController;
