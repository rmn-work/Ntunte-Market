import { Request, Response } from 'express';
import { pool } from '../../config/database';

export const createListingController = async (req: Request, res: Response) => {
  try {
    const { title, description, starting_price, category, sale_type, user_id, end_time } = req.body;

    // Conversion sécurisée de la date de fin en objet Date valide pour PostgreSQL
    const parsedEndTime = end_time ? new Date(end_time) : null;
    const finalEndTime = parsedEndTime && !isNaN(parsedEndTime.getTime()) ? parsedEndTime.toISOString() : null;

    const query = `
      INSERT INTO listings (title, description, starting_price, category, sale_type, user_id, end_time, current_highest_bid)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $3)
      RETURNING *;
    `;

    const values = [
      title,
      description,
      starting_price,
      category || 'general',
      sale_type || 'DIRECT',
      user_id || 1,
      finalEndTime
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "Annonce créée avec succès sur Render !",
      listing: result.rows[0]
    });
  } catch (error: any) {
    console.error("Erreur création annonce:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};