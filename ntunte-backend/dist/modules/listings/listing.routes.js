"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const search_controller_1 = require("./search.controller");
const listing_controller_1 = require("./listing.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/listings
router.get('/', search_controller_1.searchListingsController);
// GET /api/listings/nearby
router.get('/nearby', search_controller_1.searchListingsController);
// POST /api/listings
router.post('/', auth_middleware_1.authenticateToken, listing_controller_1.createListingController);
// GET /api/listings/:id/bids
router.get('/:id/bids', listing_controller_1.getListingBidsController);
// POST /api/listings/:id/bid
router.post('/:id/bid', listing_controller_1.placeBidController);
exports.default = router;
