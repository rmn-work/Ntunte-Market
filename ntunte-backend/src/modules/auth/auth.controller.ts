import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'ntunte_super_secret_key_2026';

export class AuthController {
  async register(req: Request, res: Response) {
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

      username = username.trim();
      email = email.trim().toLowerCase();

      // 1. Vérifier si le pseudo existe déjà
      const checkUser = await pool.query(
        `SELECT id, username FROM users WHERE username = $1`,
        [username]
      );

      if (checkUser.rows.length > 0) {
        const randomSuffix = Math.floor(100 + Math.random() * 900);
        const suggestedUsername = `${username}_${randomSuffix}`;

        return res.status(409).json({
          success: false,
          taken: true,
          message: "Ce pseudo est déjà utilisé.",
          suggestion: suggestedUsername
        });
      }

      // 2. Hasher le mot de passe
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 3. Insérer en base de données
      const newUser = await pool.query(
        `INSERT INTO users (username, phone_number, email, password_hash, full_name, id_card_url, kyc_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'PENDING_VERIFICATION', NOW())
         RETURNING id, username, email, full_name, kyc_status`,
        [username, finalPhone, email, passwordHash, full_name || null, id_card_url || null]
      );

      const user = newUser.rows[0];

      // 4. Générer le token JWT immédiatement pour connecter l'utilisateur
      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        message: "Inscription réussie.",
        token,
        user,
        kyc_status: "PENDING_VERIFICATION"
      });

    } catch (error: any) {
      console.error("Erreur lors de l'inscription :", error);
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: "Cet e-mail ou ce pseudo est déjà utilisé."
        });
      }
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { identifier, email, username, password } = req.body;
      const loginId = (identifier || email || username || '').trim();

      if (!loginId || !password) {
        return res.status(400).json({
          success: false,
          message: "Veuillez fournir votre e-mail (ou pseudo) et votre mot de passe."
        });
      }

      // 1. Rechercher l'utilisateur par e-mail ou pseudo
      const result = await pool.query(
        `SELECT id, username, email, password_hash, password, full_name, kyc_status
         FROM users
         WHERE LOWER(email) = LOWER($1) OR username = $1`,
        [loginId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Identifiants incorrects."
        });
      }

      const user = result.rows[0];
      const validHash = user.password_hash || user.password;

      if (!validHash) {
        return res.status(401).json({
          success: false,
          message: "Compte mal configuré (aucun mot de passe enregistré). Veuillez vous réinscrire."
        });
      }

      // 2. Vérifier le mot de passe de manière sécurisée
      const isPasswordValid = await bcrypt.compare(password, validHash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Identifiants incorrects."
        });
      }

      // 3. Générer le token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        message: "Connexion réussie.",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
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
}