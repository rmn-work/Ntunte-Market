import { Router } from 'express';
import { searchListingsController } from './search.controller';
import { pool } from '../../config/database'; // Gardé si vous avez d'autres routes spécifiques (création, etc.)

const router = Router();

/**
 * GET /api/listings
 * Utilise désormais le contrôleur de recherche unifié (gère la liste complète,
 * la recherche par mots-clés, les filtres, la pagination et la géolocalisation PostGIS)
 */
router.get('/', searchListingsController);

/**
 * GET /api/listings/nearby
 * (Optionnel si déjà géré par searchListingsController avec lat/lng,
 * mais conservé ici pour rétrocompatibilité avec vos écrans Flutter/Web)
 */
router.get('/nearby', searchListingsController);

export default router;