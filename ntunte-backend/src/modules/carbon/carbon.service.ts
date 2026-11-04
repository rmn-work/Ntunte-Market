import { query } from '../../config/database';

export class CarbonService {

  // Facteurs d'émission moyens de référence (en kg de CO2 évité par catégorie d'article d'occasion)
  private static carbonFactors: Record<string, number> = {
    'smartphones': 60.0,
    'ordinateurs': 250.0,
    'vetements': 15.0,
    'mobilier': 100.0,
    'vehicules': 2000.0,
    'electroenager': 180.0,
    'autre': 10.0
  };

  /**
   * Calcule le CO2 épargné lors de la vente/achat d'un article de seconde main.
   */
  static calculateCarbonSaved(category: string): number {
    const normalizedCategory = category.toLowerCase().trim();
    const savedKg = this.carbonFactors[normalizedCategory] || this.carbonFactors['autre'];
    return savedKg;
  }

  /**
   * 1. Analyse IA (Textuelle / LLM) : Détecte automatiquement la catégorie à partir du titre
   * et de la description de l'annonce et génère une astuce écologique.
   */
  static async analyzeListingWithAI(title: string, description: string): Promise<{ category: string; carbonSavedKg: number; ecoTip: string }> {
    const textToAnalyze = `${title} ${description}`.toLowerCase();

    let detectedCategory = 'autre';

    if (textToAnalyze.includes('iphone') || textToAnalyze.includes('samsung') || textToAnalyze.includes('telephone') || textToAnalyze.includes('tecno') || textToAnalyze.includes('itel')) {
      detectedCategory = 'smartphones';
    } else if (textToAnalyze.includes('pc') || textToAnalyze.includes('ordinateur') || textToAnalyze.includes('macbook') || textToAnalyze.includes('hp') || textToAnalyze.includes('laptop')) {
      detectedCategory = 'ordinateurs';
    } else if (textToAnalyze.includes('chemise') || textToAnalyze.includes('pantalon') || textToAnalyze.includes('robe') || textToAnalyze.includes('chaussure') || textToAnalyze.includes('veste')) {
      detectedCategory = 'vetements';
    } else if (textToAnalyze.includes('table') || textToAnalyze.includes('chaise') || textToAnalyze.includes('lit') || textToAnalyze.includes('armoire') || textToAnalyze.includes('canape')) {
      detectedCategory = 'mobilier';
    } else if (textToAnalyze.includes('voiture') || textToAnalyze.includes('moto') || textToAnalyze.includes('vehicule')) {
      detectedCategory = 'vehicules';
    } else if (textToAnalyze.includes('frigo') || textToAnalyze.includes('televiseur') || textToAnalyze.includes('tv') || textToAnalyze.includes('machine')) {
      detectedCategory = 'electroenager';
    }

    const carbonSavedKg = this.calculateCarbonSaved(detectedCategory);

    const ecoTips: Record<string, string> = {
      'smartphones': "Acheter un téléphone d'occasion évite l'extraction de métaux rares et préserve la planète.",
      'ordinateurs': "Prolonger la durée de vie d'un ordinateur réduit considérablement son empreinte numérique globale.",
      'vetements': "L'industrie textile est très consommatrice d'eau. La seconde main est un geste fort pour l'environnement.",
      'mobilier': "Réutiliser des meubles permet de lutter contre la déforestation et d'économiser des matières premières.",
      'vehicules': "L'achat d'un véhicule d'occasion économise la lourde empreinte carbone liée à sa fabrication initiale.",
      'electroenager': "Le réemploi des appareils ménagers évite la création de déchets électroniques complexes.",
      'autre': "Chaque objet réutilisé sur Ntunte est une victoire pour la préservation de la nature au Burundi !"
    };

    return {
      category: detectedCategory,
      carbonSavedKg,
      ecoTip: ecoTips[detectedCategory] || ecoTips['autre']
    };
  }

  /**
   * 2. Incrémente le compteur écologique sur le profil utilisateur et renvoie les équivalences écologiques.
   */
  static async registerCarbonSavingsForUser(userId: number, listingCategory: string, customCarbonAmount?: number) {
    const carbonAmount = customCarbonAmount || this.calculateCarbonSaved(listingCategory);

    const updateQuery = `
      UPDATE users
      SET total_carbon_saved_kg = total_carbon_saved_kg + $1
      WHERE id = $2
      RETURNING total_carbon_saved_kg;
    `;

    const result = await query(updateQuery, [carbonAmount, userId]);
    const totalSaved = result.rows[0]?.total_carbon_saved_kg || carbonAmount;

    // Calcul de l'équivalence en nombre d'arbres (1 arbre absorbe en moyenne 22 kg de CO2/an)
    const equivalentTrees = (totalSaved / 22.0).toFixed(1);

    return {
      success: true,
      category: listingCategory,
      added_carbon_saved_kg: carbonAmount,
      total_carbon_saved_kg: parseFloat(totalSaved),
      equivalence: {
        trees_equivalent: parseFloat(equivalentTrees),
        message: `Félicitations ! Vous avez épargné ${carbonAmount} kg de CO2 à la nature sur cette transaction (total: ${totalSaved} kg, soit environ ${equivalentTrees} arbres plantés !).`
      }
    };
  }
}