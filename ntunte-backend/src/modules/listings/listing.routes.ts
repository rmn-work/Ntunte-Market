import { Router, Request, Response } from 'express';
// Importez votre pool de connexion PostgreSQL configuré (ex: pg pool)
import { pool } from '../../config/database';

const router = Router();

/**
 * GET /api/listings/nearby
 * Paramètres de requête attendus :
 * - lat : Latitude de l'utilisateur (ex: -3.3822 pour Bujumbura)
 * - lng : Longitude de l'utilisateur (ex: 29.3644 pour Bujumbura)
 * - radius : Rayon de recherche en kilomètres (optionnel, défaut 20 km)
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

    // Requête PostGIS optimisée avec l'index spatial GIST
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

    // Note : $1 = Longitude, $2 = Latitude, $3 = Rayon en mètres ($3 * 1000)
    const values = [userLng, userLat, radiusKm];

    const result = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows, // Liste des annonces triées de la plus proche à la plus lointaine avec leur distance en km
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