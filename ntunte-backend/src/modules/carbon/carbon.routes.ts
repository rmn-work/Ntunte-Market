import { Router } from 'express';
import { CarbonService } from './carbon.service';

const router = Router();

router.post('/calculate', (req, res) => {
  const { category, quantity } = req.body;
  const carbonSavedKg = CarbonService.calculateSavings(category, quantity);

  res.status(200).json({
    success: true,
    category,
    carbon_saved_kg: carbonSavedKg,
    message: `Cette transaction a permis d'économiser environ ${carbonSavedKg} kg de CO2 ! 🌱`
  });
});

export default router;