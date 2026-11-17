"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeBidController = exports.getListingBidsController = exports.createListingController = void 0;
const database_1 = require("../../config/database");
const createListingController = async (req, res) => {
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
        const result = await database_1.pool.query(query, values);
        res.status(201).json({
            success: true,
            message: "Annonce créée avec succès !",
            listing: result.rows[0]
        });
    }
    catch (error) {
        console.error("Erreur création annonce:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.createListingController = createListingController;
const getListingBidsController = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database_1.pool.query(`SELECT
        b.id,
        b.listing_id,
        b.user_id,
        b.amount,
        b.created_at,
        COALESCE(NULLIF(b.bidder_name, ''), u.username, u.name, CONCAT('Enchérisseur #', b.user_id)) AS bidder_name
      FROM bids b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.listing_id = $1
      ORDER BY b.amount DESC, b.created_at DESC`, [id]);
        return res.status(200).json({
            success: true,
            bids: result.rows
        });
    }
    catch (error) {
        console.error("Erreur récupération historique enchères:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
exports.getListingBidsController = getListingBidsController;
const placeBidController = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, user_id, bidder_name } = req.body;
        const numericAmount = parseFloat(amount);
        const userId = user_id || 1;
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ success: false, message: "Montant invalide." });
        }
        // 1. Vérifier le prix actuel et l'expiration de l'annonce
        const listingRes = await database_1.pool.query(`SELECT starting_price, current_highest_bid, end_time FROM listings WHERE id = $1`, [id]);
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
        // 2. Déterminer le pseudo à enregistrer
        let resolvedBidderName = bidder_name?.trim();
        if (!resolvedBidderName) {
            const userRes = await database_1.pool.query(`SELECT COALESCE(username, name, CONCAT('Enchérisseur #', id)) AS display_name FROM users WHERE id = $1`, [userId]);
            resolvedBidderName = userRes.rows[0]?.display_name || `Enchérisseur #${userId}`;
        }
        // 3. Insérer l'enchère dans la table `bids`
        const insertBidRes = await database_1.pool.query(`INSERT INTO bids (listing_id, user_id, amount, bidder_name, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, listing_id, user_id, amount, bidder_name, created_at`, [id, userId, numericAmount, resolvedBidderName]);
        // 4. Mettre à jour l'offre la plus haute sur l'annonce
        await database_1.pool.query(`UPDATE listings SET current_highest_bid = $1 WHERE id = $2`, [numericAmount, id]);
        const savedBid = insertBidRes.rows[0];
        // 5. Diffuser en temps réel à tous les clients (Web & Mobile)
        const io = req.app.get('io');
        if (io) {
            io.emit('new_bid', savedBid);
        }
        return res.status(201).json({
            success: true,
            message: "Enchère enregistrée avec succès !",
            bid: savedBid
        });
    }
    catch (error) {
        console.error("Erreur lors du placement de l'enchère:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
exports.placeBidController = placeBidController;
