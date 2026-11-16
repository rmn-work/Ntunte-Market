import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:ntunte_mobile/core/network/api_client.dart';
import 'package:ntunte_mobile/features/listings/screens/listing_detail_screen.dart';
import 'package:ntunte_mobile/features/listings/screens/create_listing_screen.dart';

class NearbyListingsScreen extends StatefulWidget {
  const NearbyListingsScreen({super.key});

  @override
  State<NearbyListingsScreen> createState() => _NearbyListingsScreenState();
}

class _NearbyListingsScreenState extends State<NearbyListingsScreen> {
  final ApiClient _ApiClient = ApiClient();
  bool _isLoading = true;
  List<dynamic> _listings = [];
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchListings();
  }

  double _parsePrice(Map<String, dynamic> listing) {
    final possibleKeys = [
      'current_highest_bid',
      'starting_price',
      'price',
      'Prix',
      'PRICE',
      'prix',
      'amount',
      'cost',
      'montant',
      'value'
    ];

    dynamic rawPrice;

    for (var key in possibleKeys) {
      if (listing.containsKey(key) && listing[key] != null) {
        rawPrice = listing[key];
        break;
      }
    }

    if (rawPrice == null) return 0.0;
    if (rawPrice is double) return rawPrice;
    if (rawPrice is int) return rawPrice.toDouble();

    final cleaned = rawPrice.toString().replaceAll(RegExp(r'[^0-9.]'), '');
    return double.tryParse(cleaned) ?? 0.0;
  }

  Future<void> _fetchListings() async {
    try {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });

      // Appel vers votre API Node.js (/api/listings)
      final response = await _ApiClient.dio.get('/api/listings');
      print("RÉPONSE BRUTE DE L'API : ${response.data}");

      List<dynamic> extractedList = [];

      if (response.data is List) {
        extractedList = response.data;
      } else if (response.data is Map) {
        final Map<String, dynamic> dataMap = response.data;
        if (dataMap['results'] is List) {
          extractedList = dataMap['results'];
        } else if (dataMap['data'] is List) {
          extractedList = dataMap['data'];
        } else if (dataMap['listings'] is List) {
          extractedList = dataMap['listings'];
        } else {
          for (var value in dataMap.values) {
            if (value is List) {
              extractedList = value;
              break;
            }
          }
        }
      }

      setState(() {
        _listings = extractedList;
        _isLoading = false;
      });
    } on DioException catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = "Impossible de contacter le serveur. Veuillez réessayer.";
      });
      print("Erreur API [${e.response?.statusCode}] : ${e.message}");
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = "Une erreur est survenue : $e";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Ntunte Market"),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline, size: 28),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => CreateListingScreen(
                    onListingCreated: _fetchListings,
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text(
                    "Connexion au serveur en cours...",
                    style: TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            )
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.red, fontSize: 16),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _fetchListings,
                          child: const Text("Réessayer"),
                        ),
                      ],
                    ),
                  ),
                )
              : _listings.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Text(
                          "Aucune annonce trouvée pour le moment.",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _fetchListings,
                      child: ListView.builder(
                        itemCount: _listings.length,
                        itemBuilder: (context, index) {
                          final listing = _listings[index] is Map<String, dynamic>
                              ? _listings[index] as Map<String, dynamic>
                              : <String, dynamic>{};

                          final double parsedPrice = _parsePrice(listing);
                          final title = listing['title'] ?? listing['titre'] ?? 'Annonce sans titre';
                          final description = listing['description'] ?? '';
                          final category = listing['category'] ?? listing['categorie'] ?? 'general';

                          return Card(
                            margin: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            elevation: 1,
                            child: ListTile(
                              onTap: () async {
                                final int listingId = int.tryParse(listing['id']?.toString() ?? '') ?? 1;
                                await Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => ListingDetailScreen(
                                      listingId: listingId,
                                      listingTitle: title,
                                      price: parsedPrice,
                                      listingCategory: category,
                                      listingDescription: description.isNotEmpty
                                          ? description
                                          : 'Aucune description disponible.',
                                    ),
                                  ),
                                );
                                _fetchListings(); // Met à jour le prix au retour
                              },
                              title: Text(
                                title,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black87,
                                ),
                              ),
                              subtitle: Text(
                                description,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              trailing: Text(
                                "${parsedPrice.toStringAsFixed(2)} Fbu",
                                style: const TextStyle(
                                  color: Colors.black87,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}