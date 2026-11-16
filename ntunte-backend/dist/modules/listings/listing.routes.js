"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const search_controller_1 = require("./search.controller");
const listing_controller_1 = require("./listing.controller"); // Assurez-vous que le chemin pointe vers votre contrôleur de création
const router = (0, express_1.Router)();
/**
 * GET /api/listings
 * Utilise désormais le contrôleur de recherche unifié (gère la liste complète, etc.)
 */
router.get('/', search_controller_1.searchListingsController);
/**
 * GET /api/listings/nearby
 * (Optionnel, conservé pour rétrocompatibilité Flutter/Web)
 */
router.get('/nearby', search_controller_1.searchListingsController);
/**
 * POST /api/listings
 * Permet d'ajouter un nouveau produit et de mettre à jour la base de données instantanément
 */
router.post('/', listing_controller_1.createListingController);
exports.default = router;
