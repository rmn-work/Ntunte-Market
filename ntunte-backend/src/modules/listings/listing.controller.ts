import { Request, Response } from 'express';
import { pool } from '../../config/database';

export const createListingController = async (req: Request, res: Response) => {
  try {
    const { title, description, starting_price, category, sale_type, user_id, end_time } = req.body;

    const parsedEndTime = end_time ? new Date(end_time) : null;
    const finalEndTime = parsedEndTime && !isNaN(parsedEndTime.getTime()) ? parsedEndTime.toISOString() : null;

    const query = `
      INSERT INTO listings (title, description, starting_price, category, sale_type, user_id, end_time, current_highest_bid)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $3)
      RETURNING *;
    `;

    const values = [
      title,
      description,
      starting_price,
      category || 'general',
      sale_type || 'DIRECT',
      user_id || 1,
      finalEndTime
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "Annonce créée avec succès !",
      listing: result.rows[0]
    });
  } catch (error: any) {
    console.error("Erreur création annonce:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getListingBidsController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        b.id,
        b.listing_id,
        b.user_id,
        b.amount,
        b.created_at,
        COALESCE(NULLIF(b.bidder_name, ''), u.username, u.name, CONCAT('Enchérisseur #', b.user_id)) AS bidder_name
      FROM bids b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.listing_id = $1
      ORDER BY b.amount DESC, b.created_at DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      bids: result.rows
    });
  } catch (error: any) {
    console.error("Erreur récupération historique enchères:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const placeBidController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, user_id } = req.body;
    const numericAmount = parseFloat(amount);
    const userId = user_id || 1;

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: "Montant invalide." });
    }

    // 1. Récupérer le pseudo de l'utilisateur connecté/enregistré
    const userRes = await pool.query(`SELECT username FROM users WHERE id = $1`, [userId]);
    const bidderName = userRes.rows[0]?.username || `Utilisateur #${userId}`;

    // 2. Vérifier l'annonce et le prix actuel
    const listingRes = await pool.query(
      `SELECT starting_price, current_highest_bid, end_time FROM listings WHERE id = $1`,
      [id]
    );

    if (listingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Annonce introuvable." });
    }

    const listing = listingRes.rows[0];
    const currentMax = parseFloat(listing.current_highest_bid ?? listing.starting_price ?? 0);

    if (listing.end_time && new Date(listing.end_time).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "Cette enchère est déjà terminée." });
    }

    if (numericAmount <= currentMax) {
      return res.status(400).json({
        success: false,
        message: `Votre offre doit être supérieure à ${currentMax} Fbu.`
      });
    }

    // 3. Insérer l'enchère avec le pseudo unique de l'utilisateur
    const insertBidRes = await pool.query(
      `INSERT INTO bids (listing_id, user_id, amount, bidder_name, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, listing_id, user_id, amount, bidder_name, created_at`,
      [id, userId, numericAmount, bidderName]
    );

    // 4. Mettre à jour l'offre la plus haute
    await pool.query(
      `UPDATE listings SET current_highest_bid = $1 WHERE id = $2`,
      [numericAmount, id]
    );

    const savedBid = insertBidRes.rows[0];

    // 5. Diffuser en temps réel (Web & Mobile)
    const io = req.app.get('io');
    if (io) {
      io.emit('new_bid', savedBid);
    }

    return res.status(201).json({
      success: true,
      message: "Enchère enregistrée avec succès !",
      bid: savedBid
    });
  } catch (error: any) {
    console.error("Erreur placement enchère:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};