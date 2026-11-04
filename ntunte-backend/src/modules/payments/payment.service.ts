import crypto from 'crypto';
import { query } from '../../config/database';
import { MobileMoneyProvider } from './providers/mobile-money.provider';
import { CarbonService } from '../carbon/carbon.service';

export class PaymentService {

  /**
   * 1. L'acheteur initie le paiement : les fonds sont bloqués en mode SÉQUESTRE (Escrow)
   */
  static async createEscrowTransaction(
    listingId: number,
    buyerId: number,
    sellerId: number,
    amount: number,
    paymentMethod: 'LUMICASH' | 'ECOCASH',
    buyerPhoneNumber: string
  ) {
    // Générer un code PIN secret à 4 chiffres unique pour la remise en main propre
    const rawPin = Math.floor(1000 + Math.random() * 9000).toString();
    const handoverCodeHash = crypto.createHash('sha256').update(rawPin).digest('hex');

    // Appeler l'API de l'opérateur mobile money choisi
    let gatewayResponse;
    const reference = `NTUNTE_LISTING_${listingId}_${Date.now()}`;

    if (paymentMethod === 'LUMICASH') {
      gatewayResponse = await MobileMoneyProvider.chargeLumicash(buyerPhoneNumber, amount, reference);
    } else if (paymentMethod === 'ECOCASH') {
      gatewayResponse = await MobileMoneyProvider.chargeEcocash(buyerPhoneNumber, amount, reference);
    } else {
      throw new Error("Méthode de paiement non prise en charge.");
    }

    // Enregistrer la transaction en base de données avec le statut 'HELD_IN_ESCROW'
    const insertQuery = `
      INSERT INTO transactions (listing_id, buyer_id, seller_id, amount, payment_method, payment_status, handover_code_hash)
      VALUES ($1, $2, $3, $4, $5, 'HELD_IN_ESCROW', $6)
      RETURNING id, payment_status, created_at;
    `;

    const txResult = await query(insertQuery, [listingId, buyerId, sellerId, amount, paymentMethod, handoverCodeHash]);

    return {
      success: true,
      message: "Paiement initié. Veuillez valider la transaction sur votre téléphone. Les fonds sont conservés en séquestre sécurisé.",
      transaction: txResult.rows[0],
      gateway_details: gatewayResponse,
      // Le code PIN brut est transmis UNIQUEMENT à l'acheteur pour valider la livraison finale
      secureHandoverPinForBuyer: rawPin
    };
  }

  /**
   * 2. Validation physique : L'acheteur fournit le code PIN au vendeur lors de la remise de l'article,
   * ce qui débloque instantanément les fonds pour le vendeur et calcule l'empreinte carbone épargnée.
   */
  static async releaseEscrowFunds(transactionId: number, enteredPin: string, listingCategory: string) {
    // Récupérer la transaction
    const txRes = await query('SELECT * FROM transactions WHERE id = $1', [transactionId]);
    if (txRes.rows.length === 0) {
      throw new Error("Transaction introuvable.");
    }

    const tx = txRes.rows[0];

    if (tx.payment_status !== 'HELD_IN_ESCROW') {
      throw new Error("Cette transaction ne peut plus être libérée.");
    }

    // Vérifier le code PIN haché
    const hashedInput = crypto.createHash('sha256').update(enteredPin).digest('hex');
    if (hashedInput !== tx.handover_code_hash) {
      throw new Error("Code de validation PIN erroné. Les fonds restent bloqués en sécurité.");
    }

    // Mettre à jour la transaction en statut 'COMPLETED'
    await query("UPDATE transactions SET payment_status = 'COMPLETED' WHERE id = $1", [transactionId]);

    // Marquer l'annonce comme vendue
    await query("UPDATE listings SET status = 'SOLD' WHERE id = $1", [tx.listing_id]);

    // Incrémenter l'empreinte carbone épargnée pour l'utilisateur
    const carbonResult = await CarbonService.registerCarbonSavingsForUser(tx.seller_id, listingCategory);

    // TODO: Déclencher le transfert effectif des fonds vers le compte du vendeur via l'API opérateur

    return {
      success: true,
      message: "Remise confirmée ! Les fonds du séquestre ont été versés au vendeur.",
      carbon_impact: carbonResult
    };
  }
}