import { Router } from 'express';
import { searchListingsController } from './search.controller';
import {
  createListingController,
  getListingBidsController,
  placeBidController
} from './listing.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { buyNowController } from './listing.controller'

const router = Router();

router.get('/', searchListingsController);
router.get('/nearby', searchListingsController);
router.post('/', authenticateToken, createListingController);
router.get('/:id/bids', getListingBidsController);
router.post('/:id/bid', placeBidController);
router.post('/:id/buy-now', buyNowController);

export default router;