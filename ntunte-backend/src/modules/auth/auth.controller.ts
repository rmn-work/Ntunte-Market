import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../../config/database';

export const registerUser = async (req: Request, res: Response) => {
  try {
    let { username, phone_number, email, password, full_name, id_card_url } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: "Le pseudo est obligatoire."
      });
    }

    username = username.trim();

    // 1. Vérifier si le pseudo existe déjà
    const checkUser = await pool.query(
      `SELECT id, username FROM users WHERE username = $1`,
      [username]
    );

    if (checkUser.rows.length > 0) {
      // Le pseudo est pris, on génère une suggestion unique (ex: pseudo_789)
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

    // 3. Insérer en base de données avec tous les détails et le statut 'PENDING_VERIFICATION'
    const newUser = await pool.query(
      `INSERT INTO users (username, phone_number, email, password_hash, full_name, id_card_url, kyc_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING_VERIFICATION', NOW())
       RETURNING id, username, email, full_name, kyc_status`,
      [username, phone_number, email, passwordHash, full_name, id_card_url]
    );

    return res.status(201).json({
      success: true,
      message: "Inscription réussie. Votre compte est en attente de vérification d'identité (KYC). Vous ne pouvez accéder qu'à votre profil pour le moment.",
      user: newUser.rows[0],
      kyc_status: "PENDING_VERIFICATION"
    });

  } catch (error: any) {
    console.error("Erreur lors de l'inscription :", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};