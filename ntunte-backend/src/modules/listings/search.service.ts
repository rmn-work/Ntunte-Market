import { query } from '../../config/database';

export interface SearchFilters {
  keyword?: string;
  category?: string;
  saleType?: 'DIRECT' | 'AUCTION';
  minPrice?: number;
  maxPrice?: number;
  latitude?: number;  // Latitude de l'utilisateur (ex: -3.3822 pour Bujumbura)
  longitude?: number; // Longitude de l'utilisateur (ex: 29.3644)
  radiusKm?: number;  // Rayon de recherche en km
  page?: number;
  limit?: number;
}

export class SearchService {

  static async searchListings(filters: SearchFilters) {
    const {
      keyword,
      category,
      saleType,
      minPrice,
      maxPrice,
      latitude,
      longitude,
      radiusKm = 10, // Rayon par défaut de 10 km
      page = 1,
      limit = 20
    } = filters;

    const offset = (page - 1) * limit;
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Construction dynamique de la requête SQL
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
        carbon_saved_kg,
        created_at,
        ST_Y(location::geometry) AS latitude,
        ST_X(location::geometry) AS longitude
    `;

    // Si la géolocalisation est fournie, on calcule la distance en km
    if (latitude !== undefined && longitude !== undefined) {
      sql += `, (ST_DistanceSphere(location, ST_MakePoint($${paramIndex}, $${paramIndex + 1})) / 1000) AS distance_km`;
      queryParams.push(longitude, latitude);
      paramIndex += 2;
    }

    sql += ` FROM listings WHERE status = 'ACTIVE'`;

    // Filtre par mot-clé (Recherche dans le titre ou la description)
    if (keyword) {
      sql += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      queryParams.push(`%${keyword}%`);
      paramIndex++;
    }

    // Filtre par catégorie
    if (category) {
      sql += ` AND category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    // Filtre par type de vente
    if (saleType) {
      sql += ` AND sale_type = $${paramIndex}`;
      queryParams.push(saleType);
      paramIndex++;
    }

    // Filtre par prix
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

    // Filtre par distance géographique
    if (latitude !== undefined && longitude !== undefined) {
      const radiusMeters = radiusKm * 1000;
      sql += ` AND ST_DWithin(location::geography, ST_MakePoint($1, $2)::geography, $${paramIndex})`;
      queryParams.push(radiusMeters);
      paramIndex++;

      // Trier par la distance la plus proche
      sql += ` ORDER BY distance_km ASC`;
    } else {
      // Trier par date la plus récente par défaut
      sql += ` ORDER BY created_at DESC`;
    }

    // Pagination
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(sql, queryParams);

    return {
      success: true,
      page,
      limit,
      results_count: result.rows.length,
      listings: result.rows
    };
  }
}