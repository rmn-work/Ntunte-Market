import { Request, Response } from 'express';
import { pool } from '../../config/database';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const createListingController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || req.body.user_id || req.body.userId || 1;
    const {
      title,
      description,
      starting_price,
      category,
      sale_type,
      end_time,
      buy_now_price,
      allow_buy_now
    } = req.body;

    const parsedStartingPrice = Number(starting_price);
    if (isNaN(parsedStartingPrice) || parsedStartingPrice <= 0) {
      return res.status(400).json({ success: false, message: "Le prix de départ est invalide." });
    }

    const normalizedSaleType = sale_type === 'AUCTION' ? 'AUCTION' : 'DIRECT';
    const parsedBuyNow =
      buy_now_price !== undefined && buy_now_price !== null && buy_now_price !== ''
        ? Number(buy_now_price)
        : normalizedSaleType === 'DIRECT'
        ? parsedStartingPrice
        : null;

    if (parsedBuyNow !== null && (isNaN(parsedBuyNow) || parsedBuyNow <= 0)) {
      return res.status(400).json({ success: false, message: "Le prix d'achat immédiat est invalide." });
    }

    const canBuyNow = Boolean(allow_buy_now) || (parsedBuyNow !== null && parsedBuyNow > 0);

    const parsedEndTime = end_time ? new Date(end_time) : null;
    const finalEndTime =
      parsedEndTime && !isNaN(parsedEndTime.getTime()) ? parsedEndTime.toISOString() : null;

    const query = `
      INSERT INTO listings (
        title, description, starting_price, category, sale_type,
        user_id, end_time, current_highest_bid, buy_now_price, allow_buy_now, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $3, $8, $9, 'ACTIVE')
      RETURNING *;
    `;

    const values = [
      title,
      description,
      parsedStartingPrice,
      category || 'general',
      normalizedSaleType,
      userId,
      finalEndTime,
      parsedBuyNow,
      canBuyNow
    ];

    const result = await pool.query(query, values);

    return res.status(201).json({
      success: true,
      message: "Annonce créée avec succès !",
      listing: result.rows[0]
    });
  } catch (error: any) {
    console.error("Erreur création annonce:", error);
    return res.status(500).json({ success: false, error: error.message });
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
        COALESCE(NULLIF(b.bidder_name, ''), u.username, CONCAT('Enchérisseur #', b.user_id)) AS bidder_name
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

export const placeBidController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, userId: bodyUserId } = req.body;
    const numericAmount = parseFloat(amount);

    console.log('[BID] Reçu POST /api/listings/:id/bid', {
      id,
      body: req.body,
      authUser: req.user
    });

    const userId = req.user?.id || req.user?.userId || req.user?.sub || bodyUserId || req.body?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Connectez-vous pour enchérir.' });
    }

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: "Montant invalide." });
    }

    const userRes = await pool.query(`SELECT username FROM users WHERE id = $1`, [userId]);
    const bidderName = userRes.rows[0]?.username || `Utilisateur #${userId}`;

    const listingRes = await pool.query(
      `SELECT user_id, starting_price, current_highest_bid, end_time, status FROM listings WHERE id = $1`,
      [id]
    );

    if (listingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Annonce introuvable." });
    }

    const listing = listingRes.rows[0];

    if (listing.status === 'SOLD') {
      return res.status(400).json({ success: false, message: "Cette annonce a déjà été vendue." });
    }

    if (String(listing.user_id) === String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas enchérir sur votre propre annonce.',
      });
    }

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

    const insertBidRes = await pool.query(
      `INSERT INTO bids (listing_id, user_id, amount, bidder_name, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, listing_id, user_id, amount, bidder_name, created_at`,
      [id, userId, numericAmount, bidderName]
    );

    await pool.query(
      `UPDATE listings SET current_highest_bid = $1 WHERE id = $2`,
      [numericAmount, id]
    );

    const savedBid = insertBidRes.rows[0];

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

export const buyNowController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const buyerId =
      req.user?.id || req.user?.userId || req.user?.sub || req.body?.userId || req.body?.user_id;

    if (!buyerId) {
      return res.status(401).json({ success: false, message: "Connectez-vous pour acheter." });
    }

    const listingRes = await pool.query(
      `SELECT id, user_id, starting_price, current_highest_bid, buy_now_price, allow_buy_now, sale_type, end_time, status
       FROM listings WHERE id = $1`,
      [id]
    );

    if (listingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Annonce introuvable." });
    }

    const listing = listingRes.rows[0];

    if (listing.status === 'SOLD') {
      return res.status(400).json({ success: false, message: "Cet article a déjà été vendu." });
    }

    if (listing.end_time && new Date(listing.end_time).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "Cette annonce est expirée." });
    }

    if (String(listing.user_id) === String(buyerId)) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez pas acheter votre propre annonce."
      });
    }

    const finalPrice = Number(listing.buy_now_price || listing.starting_price);
    if (!listing.allow_buy_now && !listing.buy_now_price && listing.sale_type !== 'DIRECT') {
      return res.status(400).json({
        success: false,
        message: "L'option Acheter tout de suite n'est pas activée pour cette annonce."
      });
    }

    await pool.query(
      `UPDATE listings SET status = 'SOLD', current_highest_bid = $1 WHERE id = $2`,
      [finalPrice, id]
    );

    await pool.query(
      `INSERT INTO purchases (listing_id, buyer_id, amount, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [id, buyerId, finalPrice]
    ).catch(() => {});

    const io = req.app.get('io');
    if (io) {
      io.emit('listing_sold', { listingId: id, buyerId, amount: finalPrice });
    }

    return res.status(200).json({
      success: true,
      message: "Achat immédiat effectué avec succès !",
      amount: finalPrice,
      status: 'SOLD'
    });
  } catch (error: any) {
    console.error("Erreur achat immédiat:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};