"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const search_controller_1 = require("./search.controller");
const listing_controller_1 = require("./listing.controller");
const router = (0, express_1.Router)();
/**
 * GET /api/listings
 */
router.get('/', search_controller_1.searchListingsController);
/**
 * GET /api/listings/nearby
 */
router.get('/nearby', search_controller_1.searchListingsController);
/**
 * POST /api/listings
 */
router.post('/', listing_controller_1.createListingController);
/**
 * GET /api/listings/:id/bids
 * Récupère l'historique des enchères (pseudo, heure, somme) pour un produit
 */
router.get('/:id/bids', listing_controller_1.getListingBidsController);
/**
 * POST /api/listings/:id/bid
 * Place une nouvelle enchère sur un produit
 */
router.post('/:id/bid', listing_controller_1.placeBidController);
exports.default = router;
