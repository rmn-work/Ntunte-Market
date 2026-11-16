"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const database_1 = require("../../config/database");
class SearchService {
    static async searchListings(filters) {
        const { keyword, category, saleType, minPrice, maxPrice, latitude, longitude, radiusKm = 10, page = 1, limit = 20 } = filters;
        const offset = (page - 1) * limit;
        const queryParams = [];
        let paramIndex = 1;
        let sql = `
      SELECT
        id,
        user_id,
        title,
        description,
        category,
        sale_type,
        starting_price,
        current_highest_bid,
        created_at,
        end_time,
        ST_Y(location::geometry) AS latitude,
        ST_X(location::geometry) AS longitude
    `;
        if (latitude !== undefined && longitude !== undefined) {
            sql += `, (ST_DistanceSphere(location, ST_MakePoint($${paramIndex}, $${paramIndex + 1})) / 1000) AS distance_km`;
            queryParams.push(longitude, latitude);
            paramIndex += 2;
        }
        sql += ` FROM listings WHERE 1=1`;
        if (keyword) {
            sql += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
            queryParams.push(`%${keyword}%`);
            paramIndex++;
        }
        if (category) {
            sql += ` AND category = $${paramIndex}`;
            queryParams.push(category);
            paramIndex++;
        }
        if (saleType) {
            sql += ` AND sale_type = $${paramIndex}`;
            queryParams.push(saleType);
            paramIndex++;
        }
        if (minPrice !== undefined) {
            sql += ` AND starting_price >= $${paramIndex}`;
            queryParams.push(minPrice);
            paramIndex++;
        }
        if (maxPrice !== undefined) {
            sql += ` AND starting_price <= $${paramIndex}`;
            queryParams.push(maxPrice);
            paramIndex++;
        }
        if (latitude !== undefined && longitude !== undefined) {
            const radiusMeters = radiusKm * 1000;
            sql += ` AND ST_DWithin(location::geography, ST_MakePoint($1, $2)::geography, $${paramIndex})`;
            queryParams.push(radiusMeters);
            paramIndex++;
            sql += ` ORDER BY distance_km ASC`;
        }
        else {
            sql += ` ORDER BY created_at DESC`;
        }
        sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);
        const result = await (0, database_1.query)(sql, queryParams);
        const rawRows = result?.rows || [];
        const listingsArray = Array.isArray(rawRows) ? rawRows : Object.values(rawRows);
        return {
            success: true,
            page,
            limit,
            results_count: listingsArray.length,
            listings: listingsArray
        };
    }
}
exports.SearchService = SearchService;
