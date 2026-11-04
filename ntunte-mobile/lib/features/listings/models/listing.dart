class Listing {
  final int id;
  final int userId;
  final String title;
  final String description;
  final String category;
  final String saleType; // 'DIRECT' ou 'AUCTION'
  final double startingPrice;
  final double? currentHighestBid;
  final double carbonSavedKg;
  final double? distanceKm;
  final String status;
  final DateTime createdAt;

  Listing({
    required this.id,
    required this.userId,
    required this.title,
    required this.description,
    required this.category,
    required this.saleType,
    required this.startingPrice,
    this.currentHighestBid,
    required this.carbonSavedKg,
    this.distanceKm,
    required this.status,
    required this.createdAt,
  });

  factory Listing.fromJson(Map<String, dynamic> json) {
    return Listing(
      id: json['id'],
      userId: json['user_id'],
      title: json['title'],
      description: json['description'],
      category: json['category'],
      saleType: json['sale_type'],
      startingPrice: double.parse(json['starting_price'].toString()),
      currentHighestBid: json['current_highest_bid'] != null
          ? double.parse(json['current_highest_bid'].toString())
          : null,
      carbonSavedKg: double.parse(json['carbon_saved_kg'].toString()),
      distanceKm: json['distance_km'] != null
          ? double.parse(json['distance_km'].toString())
          : null,
      status: json['status'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}