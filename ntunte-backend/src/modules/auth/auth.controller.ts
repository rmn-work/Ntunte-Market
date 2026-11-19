import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../config/database';
import { AuthRequest } from '../../middlewares/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'ntunte_dev_secret_key_2026';

const generateToken = (user: { id: number; username?: string; email?: string; phone_number?: string }) => {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

export class AuthController {
  // Inscription unifiée (gère pseudo, e-mail, téléphone et optionnellement KYC)
  static async register(req: Request, res: Response) {
    try {
      let { username, phone_number, phone, email, password, full_name, id_card_url } = req.body;
      const finalPhone = phone_number || phone || null;

      if (!username || !username.trim()) {
        return res.status(400).json({
          success: false,
          message: "Le pseudo est obligatoire."
        });
      }

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "L'e-mail et le mot de passe sont obligatoires."
        });
      }

      const cleanUsername = username.trim();
      const cleanEmail = email.trim().toLowerCase();

      // Vérifier si le pseudo ou l'email existe déjà
      const existing = await pool.query(
        `SELECT username, email FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)`,
        [cleanUsername, cleanEmail]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Cet e-mail ou ce pseudo est déjà utilisé."
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const insertRes = await pool.query(
        `INSERT INTO users (username, phone_number, email, password_hash, full_name, id_card_url, kyc_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'PENDING_VERIFICATION', NOW())
         RETURNING id, username, email, phone_number, full_name, kyc_status, created_at`,
        [cleanUsername, finalPhone, cleanEmail, passwordHash, full_name || null, id_card_url || null]
      );

      const newUser = insertRes.rows[0];
      const token = generateToken(newUser);

      return res.status(201).json({
        success: true,
        message: "Inscription réussie. Compte en attente de vérification KYC.",
        token,
        user: newUser
      });

    } catch (error: any) {
      console.error("Erreur lors de l'inscription :", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de l'inscription.",
        error: error.message
      });
    }
  }

  // Connexion unifiée (via email ou pseudo)
  static async login(req: Request, res: Response) {
    try {
      const { identifier, email, username, password } = req.body;
      const loginId = (identifier || email || username || '').trim();

      if (!loginId || !password) {
        return res.status(400).json({
          success: false,
          message: "Veuillez fournir votre e-mail (ou pseudo) et votre mot de passe."
        });
      }

      const userRes = await pool.query(
        `SELECT id, username, email, phone_number, password_hash, full_name, kyc_status
         FROM users
         WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)`,
        [loginId]
      );

      if (userRes.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Identifiants incorrects."
        });
      }

      const user = userRes.rows[0];

      if (!user.password_hash) {
        return res.status(401).json({
          success: false,
          message: "Compte mal configuré (aucun mot de passe enregistré)."
        });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: "Identifiants incorrects."
        });
      }

      const token = generateToken(user);

      return res.status(200).json({
        success: true,
        message: "Connexion réussie.",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone_number: user.phone_number,
          full_name: user.full_name,
          kyc_status: user.kyc_status
        }
      });

    } catch (error: any) {
      console.error("Erreur lors de la connexion :", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la connexion.",
        error: error.message
      });
    }
  }

  // Récupérer le profil connecté
  static async getProfileDetails(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      const result = await pool.query(
        `SELECT id, username, email, phone_number, full_name, kyc_status, id_card_url, created_at FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Utilisateur non trouvé." });
      }

      return res.status(200).json({
        success: true,
        profile: result.rows[0]
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}