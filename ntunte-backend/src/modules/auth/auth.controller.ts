import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
// Importez votre pool de connexion PostgreSQL ici

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { phone_number, email, password, full_name, id_card_url } = req.body;

    // 1. Vérifier si l'utilisateur existe déjà
    // const userExists = ...

    // 2. Hasher le mot de passe
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Insérer en base de données avec le statut par défaut 'PENDING_VERIFICATION'
    /*
       INSERT INTO users (phone_number, email, password_hash, full_name, id_card_url, kyc_status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING_VERIFICATION')
    */

    return res.status(201).json({
      success: true,
      message: "Inscription réussie. Votre compte est en attente de vérification d'identité (KYC). Vous ne pouvez accéder qu'à votre profil pour le moment.",
      kyc_status: "PENDING_VERIFICATION"
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
};