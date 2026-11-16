"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const carbon_service_1 = require("./carbon.service");
const router = (0, express_1.Router)();
router.post('/calculate', async (req, res) => {
    try {
        const { category } = req.body; // On ne garde que category
        // Ajout de await puisque calculateSavings est async
        const carbonSavedKg = await carbon_service_1.CarbonService.calculateSavings(category);
        return res.status(200).json({
            success: true,
            category,
            carbon_saved_kg: carbonSavedKg,
            message: `Cette transaction a permis d'économiser environ ${carbonSavedKg} kg de CO2 ! 🌱`
        });
    }
    catch (error) {
        console.error("Erreur lors du calcul carbone :", error.message);
        return res.status(500).json({
            success: false,
            error: "Erreur interne du serveur"
        });
    }
});
exports.default = router;
