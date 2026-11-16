"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("../../config/database");
class UserController {
    /**
     * Inscription d'un nouvel utilisateur (Mobile Flutter ou Web Next.js)
     */
    static async register(req, res) {
        try {
            const { phone_number, email, password, full_name, id_card_url } = req.body;
            if (!phone_number || !password || !full_name || !id_card_url) {
                return res.status(400).json({
                    success: false,
                    message: "Tous les champs obligatoires (téléphone, mot de passe, nom complet, photo d'identité ID) doivent être fournis."
                });
            }
            // 1. Vérifier si le numéro de téléphone existe déjà
            const existingUser = await (0, database_1.query)('SELECT id FROM users WHERE phone_number = $1', [phone_number]);
            if (existingUser.rows.length > 0) {
                return res.status(409).json({ success: false, message: "Ce numéro de téléphone est déjà associé à un compte Ntunte." });
            }
            // 2. Hasher le mot de passe de manière sécurisée
            const saltRounds = 10;
            const passwordHash = await bcrypt_1.default.hash(password, saltRounds);
            // 3. Insérer l'utilisateur avec le statut par défaut 'PENDING_VERIFICATION' (Accès bloqué)
            const insertQuery = `
        INSERT INTO users (phone_number, email, password_hash, full_name, kyc_status, id_card_url)
        VALUES ($1, $2, $3, $4, 'PENDING_VERIFICATION', $5)
        RETURNING id, phone_number, full_name, kyc_status, created_at;
      `;
            const newUser = await (0, database_1.query)(insertQuery, [phone_number, email || null, passwordHash, full_name, id_card_url]);
            return res.status(201).json({
                success: true,
                message: "Inscription enregistrée. Votre compte est soumis à la vérification d'identité obligatoire par photo d'ID. L'accès aux fonctionnalités d'achat/vente est bloqué jusqu'à validation.",
                user: newUser.rows[0]
            });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
    /**
     * Consulter ses propres détails d'inscription (Seule route autorisée en mode PENDING)
     */
    static async getProfileDetails(req, res) {
        try {
            const userId = req.user?.id; // Injecté par le middleware JWT
            const result = await (0, database_1.query)('SELECT id, phone_number, email, full_name, kyc_status, id_card_url, total_carbon_saved_kg, created_at FROM users WHERE id = $1', [userId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: "Utilisateur non trouvé." });
            }
            return res.status(200).json({
                success: true,
                profile: result.rows[0]
            });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
}
exports.UserController = UserController;
