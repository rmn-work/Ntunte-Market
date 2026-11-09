import { Router } from 'express';
import { CarbonService } from './carbon.service';

const router = Router();

router.post('/calculate', async (req, res) => {
  try {
    const { category } = req.body; // On ne garde que category

    // Ajout de await puisque calculateSavings est async
    const carbonSavedKg = await CarbonService.calculateSavings(category);

    return res.status(200).json({
      success: true,
      category,
      carbon_saved_kg: carbonSavedKg,
      message: `Cette transaction a permis d'économiser environ ${carbonSavedKg} kg de CO2 ! 🌱`
    });
  } catch (error: any) {
    console.error("Erreur lors du calcul carbone :", error.message);
    return res.status(500).json({
      success: false,
      error: "Erreur interne du serveur"
    });
  }
});

export default router;