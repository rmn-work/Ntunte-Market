import { Router } from 'express';
import { searchListingsController } from './search.controller';
import {
  createListingController,
  getListingBidsController,
  placeBidController
} from './listing.controller';

const router = Router();

/**
 * GET /api/listings
 */
router.get('/', searchListingsController);

/**
 * GET /api/listings/nearby
 */
router.get('/nearby', searchListingsController);

/**
 * POST /api/listings
 */
router.post('/', createListingController);

/**
 * GET /api/listings/:id/bids
 * Récupère l'historique des enchères (pseudo, heure, somme) pour un produit
 */
router.get('/:id/bids', getListingBidsController);

/**
 * POST /api/listings/:id/bid
 * Place une nouvelle enchère sur un produit
 */
router.post('/:id/bid', placeBidController);

export default router;