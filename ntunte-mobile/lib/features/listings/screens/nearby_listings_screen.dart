import 'package:flutter/material.dart';
import 'package:ntunte_mobile/core/network/api_client.dart';

class NearbyListingsScreen extends StatefulWidget {
  const NearbyListingsScreen({Key? key}) : super(key: key);

  @override
  State<NearbyListingsScreen> createState() => _NearbyListingsScreenState();
}

class _NearbyListingsScreenState extends State<NearbyListingsScreen> {
  List<dynamic> _listings = [];
  bool _isLoading = true;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    // Par défaut, position centrée sur Bujumbura (Latitude: -3.3822, Longitude: 29.3644)
    // En production, vous pourrez utiliser le paquet 'geolocator' pour récupérer la position réelle du téléphone.
    _fetchNearbyListings(lat: -3.3822, lng: 29.3644);
  }

  Future<void> _fetchNearbyListings({required double lat, required double lng}) async {
    try {
      final apiClient = ApiClient();

      // Appel de l'endpoint PostGIS '/api/listings/nearby' sur votre backend Render
      final response = await apiClient.dio.get(
        '/api/listings/nearby',
        queryParameters: {
          'lat': lat,
          'lng': lng,
          'radius': 25, // Rayon de recherche de 25 km
        },
      );

      if (response.data['success'] == true) {
        setState(() {
          _listings = response.data['data'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = "Erreur lors de la récupération des données.";
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = "Impossible de joindre le serveur : $e";
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Annonces à proximité (Burundi)'),
        backgroundColor: Colors.green,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.green))
          : _errorMessage.isNotEmpty
              ? Center(child: Text(_errorMessage, style: const TextStyle(color: Colors.red)))
              : _listings.isEmpty
                  ? const Center(
                      child: Text(
                        'Aucune annonce trouvée dans un rayon de 25 km.',
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                    )
                  : ListView.builder(
                      itemCount: _listings.length,
                      padding: const EdgeInsets.all(12),
                      itemBuilder: (context, index) {
                        final listing = _listings[index];
                        // Arrondir la distance à 1 chiffre après la virgule
                        final double distance = (listing['distance_km'] as num?)?.toDouble() ?? 0.0;
                        final String formattedDistance = distance < 1
                            ? "${(distance * 1000).toStringAsFixed(0)} m"
                            : "${distance.toStringAsFixed(1)} km";

                        return Card(
                          elevation: 3,
                          margin: const EdgeInsets.symmetric(vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          child: ListTile(
                            contentPadding: const EdgeInsets.all(16),
                            title: Text(
                              listing['title'] ?? 'Sans titre',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(height: 6),
                                Text(
                                  'Prix : ${listing['starting_price']} BIF',
                                  style: const TextStyle(color: Colors.green, fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.location_on, size: 16, color: Colors.redAccent),
                                    const SizedBox(width: 4),
                                    Text('À $formattedDistance de vous', style: const TextStyle(color: Colors.grey)),
                                  ],
                                ),
                              ],
                            ),
                            trailing: Chip(
                              label: Text(
                                listing['sale_type'] ?? 'DIRECT',
                                style: const TextStyle(fontSize: 10, color: Colors.white),
                              ),
                              backgroundColor: listing['sale_type'] == 'AUCTION' ? Colors.orange : Colors.teal,
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}