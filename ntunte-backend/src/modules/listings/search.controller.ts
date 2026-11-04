import { Request, Response } from 'express';
import { SearchService } from './search.service';

export const searchListingsController = async (req: Request, res: Response) => {
  try {
    const {
      q,
      category,
      sale_type,
      min_price,
      max_price,
      lat,
      lng,
      radius,
      page,
      limit
    } = req.query;

    const filters = {
      keyword: q ? String(q) : undefined,
      category: category ? String(category) : undefined,
      saleType: sale_type as 'DIRECT' | 'AUCTION',
      minPrice: min_price ? parseFloat(String(min_price)) : undefined,
      maxPrice: max_price ? parseFloat(String(max_price)) : undefined,
      latitude: lat ? parseFloat(String(lat)) : undefined,
      longitude: lng ? parseFloat(String(lng)) : undefined,
      radiusKm: radius ? parseFloat(String(radius)) : 10,
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 20
    };

    const results = await SearchService.searchListings(filters);
    return res.status(200).json(results);

  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};