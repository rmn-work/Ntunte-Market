import { Request, Response } from 'express';
import pool from '../../config/database'; // Ajustez le chemin selon votre structure

export const createListingController = async (req: Request, res: Response) => {
  try {
    const { title, description, starting_price, category, sale_type, user_id } = req.body;

    const query = `
      INSERT INTO listings (title, description, starting_price, category, sale_type, user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const values = [
      title,
      description,
      starting_price,
      category || 'general',
      sale_type || 'DIRECT',
      user_id || 1
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "Annonce créée avec succès sur Render !",
      listing: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};