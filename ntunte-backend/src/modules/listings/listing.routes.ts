import { Router, Request, Response } from 'express';
import { pool } from '../../config/database';

const router = Router();

/**
 * GET /api/listings
 * Récupère la liste de toutes les annonces
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, title, description, starting_price, category, sale_type FROM listings ORDER BY id DESC'
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des annonces :", error.message);
    return res.status(500).json({
      success: false,
      error: "Erreur interne du serveur"
    });
  }
});

/**
 * GET /api/listings/nearby
 * Recherche géolocalisée avec PostGIS
 * Paramètres : lat, lng, radius (optionnel, défaut 20 km)
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = '20' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: "Les paramètres 'lat' (latitude) et 'lng' (longitude) sont obligatoires."
      });
    }

    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string);

    const query = `
      SELECT
        id,
        title,
        description,
        starting_price,
        category,
        sale_type,
        ST_Distance(
          location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) / 1000 AS distance_km
      FROM listings
      WHERE location IS NOT NULL
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3 * 1000
        )
      ORDER BY distance_km ASC;
    `;

    const values = [userLng, userLat, radiusKm];
    const result = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });

  } catch (error: any) {
    console.error("Erreur lors de la recherche géolocalisée :", error.message);
    return res.status(500).json({
      success: false,
      error: "Erreur interne du serveur"
    });
  }
});

export default router;