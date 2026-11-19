import { Router } from 'express';
import { searchListingsController } from './search.controller';
import {
  createListingController,
  getListingBidsController,
  placeBidController
} from './listing.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();

// GET /api/listings
router.get('/', searchListingsController);

// GET /api/listings/nearby
router.get('/nearby', searchListingsController);

// POST /api/listings
router.post('/', authenticateToken, createListingController);

// GET /api/listings/:id/bids
router.get('/:id/bids', getListingBidsController);

// POST /api/listings/:id/bid
router.post('/:id/bid', placeBidController);

export default router;