import { Router } from 'express';
import { searchListingsController } from './search.controller';
import { createListingController } from './listing.controller'; // Assurez-vous que le chemin pointe vers votre contrôleur de création
import { pool } from '../../config/database';

const router = Router();

/**
 * GET /api/listings
 * Utilise désormais le contrôleur de recherche unifié (gère la liste complète, etc.)
 */
router.get('/', searchListingsController);

/**
 * GET /api/listings/nearby
 * (Optionnel, conservé pour rétrocompatibilité Flutter/Web)
 */
router.get('/nearby', searchListingsController);

/**
 * POST /api/listings
 * Permet d'ajouter un nouveau produit et de mettre à jour la base de données instantanément
 */
router.post('/', createListingController);

export default router;