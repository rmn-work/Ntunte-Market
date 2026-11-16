import 'package:flutter/material.dart';
import 'package:ntunte_mobile/core/network/api_client.dart';
import 'package:ntunte_mobile/models/listing.dart';
import 'package:ntunte_mobile/screens/auction_live_screen.dart';

class HomeScreen extends StatefulWidget {
  final int currentUserId;

  const HomeScreen({Key? key, required this.currentUserId}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiClient _apiClient = ApiClient();
  List<Listing> _listings = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchListings();
  }

  Future<void> _fetchListings() async {
    try {
      final response = await _apiClient.dio.get('/api/listings');
      final List data = response.data;
      setState(() {
        _listings = data.map((json) => Listing.fromJson(json)).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur de chargement : $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ntunte Market'),
        backgroundColor: Colors.teal,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchListings,
              child: ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: _listings.length,
                itemBuilder: (context, index) {
                  final item = _listings[index];
                  final double activePrice = item.currentHighestBid ?? item.startingPrice;

                  return Card(
                    margin: const EdgeInsets.only(bottom: 14),
                    elevation: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  item.title,
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                              ),
                              Chip(
                                label: Text(item.saleType == 'AUCTION' ? 'Enchère' : 'Direct'),
                                backgroundColor: Colors.teal.shade50,
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(item.description, style: TextStyle(color: Colors.grey[700])),
                          const SizedBox(height: 12),
                          Text(
                            'Prix actuel : ${activePrice.toStringAsFixed(0)} Fbu',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.teal,
                            ),
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              icon: const Icon(Icons.gavel, color: Colors.white),
                              label: const Text('Participer à l\'enchère', style: TextStyle(color: Colors.white)),
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.teal),
                              onPressed: () async {
                                await Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => AuctionLiveScreen(
                                      listingId: item.id,
                                      title: item.title,
                                      initialPrice: activePrice,
                                      currentUserId: widget.currentUserId,
                                    ),
                                  ),
                                );
                                // Rafraîchir la liste au retour de l'enchère
                                _fetchListings();
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}