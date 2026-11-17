import 'dart:async';
import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:ntunte_mobile/core/network/api_client.dart';
import 'package:ntunte_mobile/features/listings/widgets/carbon_impact_card.dart';

class ListingDetailScreen extends StatefulWidget {
  final int listingId;
  final String listingTitle;
  final double price;
  final String listingCategory;
  final String listingDescription;
  final int currentUserId;

  const ListingDetailScreen({
    Key? key,
    required this.listingId,
    required this.listingTitle,
    required this.price,
    required this.listingCategory,
    required this.listingDescription,
    this.currentUserId = 1,
  }) : super(key: key);

  @override
  State<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends State<ListingDetailScreen> {
  final ApiClient _apiClient = ApiClient();
  late IO.Socket _socket;
  late double _currentHighestBid;

  final TextEditingController _bidController = TextEditingController();

  List> _bidsHistory = [];
  bool _isLoadingBids = true;

  DateTime? _endTime;
  Timer? _timer;
  Duration _timeLeft = Duration.zero;
  bool _isExpired = false;

  String? _errorMessage;
  String? _successMessage;
  String? _winnerMessage;

  @override
  void initState() {
    super.initState();
    _currentHighestBid = widget.price;
    _endTime = DateTime.now().add(const Duration(hours: 24));
    _startCountdown();
    _fetchBidsHistory();
    _initWebSocket();
  }

  Future<void> _fetchBidsHistory() async {
    try {
      final response = await _apiClient.dio.get('/api/listings/${widget.listingId}/bids');
      if (mounted && response.data != null && response.data['bids'] != null) {
        final List rawBids = response.data['bids'];
        setState(() {
          _bidsHistory = rawBids.map((b) => Map<String, dynamic>.from(b)).toList();
          if (_bidsHistory.isNotEmpty) {
            final topBid = double.tryParse(_bidsHistory.first['amount'].toString());
            if (topBid != null && topBid > _currentHighestBid) {
              _currentHighestBid = topBid;
            }
          }
          _isLoadingBids = false;
        });
      } else if (mounted) {
        setState(() => _isLoadingBids = false);
      }
    } catch (e) {
      print("Erreur récupération historique mobile : $e");
      if (mounted) setState(() => _isLoadingBids = false);
    }
  }

  void _startCountdown() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_endTime == null) return;
      final diff = _endTime!.difference(DateTime.now());
      if (diff.isNegative) {
        setState(() {
          _isExpired = true;
          _timeLeft = Duration.zero;
          _winnerMessage = "🎉 Enchère terminée ! Gagnant : ${_currentHighestBid.toStringAsFixed(0)} Fbu 🏆";
        });
        _timer?.cancel();
      } else {
        setState(() {
          _timeLeft = diff;
        });
      }
    });
  }

  void _initWebSocket() {
    _socket = IO.io('https://ntunte-backend.onrender.com', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });

    _socket.connect();

    _socket.onConnect((_) {
      _socket.emit('join_auction', widget.listingId);
    });

    // Écoute des nouvelles offres en temps réel (Web & Mobile)
    _socket.on('new_bid', (data) {
      if (mounted && data != null && data['listing_id'].toString() == widget.listingId.toString()) {
        final newBidMap = Map<String, dynamic>.from(data);
        final newAmount = double.tryParse(newBidMap['amount'].toString()) ?? _currentHighestBid;

        setState(() {
          _currentHighestBid = newAmount;
          final alreadyExists = _bidsHistory.any((b) => b['id'] != null && b['id'] == newBidMap['id']);
          if (!alreadyExists) {
            _bidsHistory.insert(0, newBidMap);
          }
          _errorMessage = null;
          _successMessage = "Nouvelle enchère en direct reçue !";
        });
      }
    });

    _socket.on('bid_error', (data) {
      if (mounted) {
        setState(() {
          _errorMessage = data['message'];
        });
      }
    });
  }

  void _placeBid() {
    if (_isExpired) return;

    final double? bidAmount = double.tryParse(_bidController.text.trim());
    if (bidAmount == null || bidAmount <= _currentHighestBid) {
      setState(() {
        _errorMessage = "Votre offre doit être supérieure à ${_currentHighestBid.toStringAsFixed(0)} Fbu.";
      });
      return;
    }

    // Envoi de l'enchère liée au compte utilisateur connecté (sans saisie manuelle de pseudo)
    _socket.emit('place_bid', {
      'listingId': widget.listingId,
      'userId': widget.currentUserId,
      'amount': bidAmount,
    });

    _bidController.clear();
  }

  String _formatBidTime(dynamic rawDate) {
    if (rawDate == null) return 'À l\'instant';
    final dt = DateTime.tryParse(rawDate.toString())?.toLocal();
    if (dt == null) return '';
    final d = dt.day.toString().padLeft(2, '0');
    final m = dt.month.toString().padLeft(2, '0');
    final h = dt.hour.toString().padLeft(2, '0');
    final min = dt.minute.toString().padLeft(2, '0');
    return '$d/$m/${dt.year} à $h:$min';
  }

  @override
  void dispose() {
    _timer?.cancel();
    _socket.disconnect();
    _socket.dispose();
    _bidController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.listingTitle)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(widget.listingTitle, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text("📦 Publié récemment", style: TextStyle(fontSize: 12, color: Colors.grey[600])),
            const SizedBox(height: 12),

            // Encart Prix & Compte à rebours
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.teal.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.teal.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Enchère actuelle la plus haute :", style: TextStyle(fontSize: 14, color: Colors.black54)),
                  const SizedBox(height: 4),
                  Text('${_currentHighestBid.toStringAsFixed(0)} Fbu',
                      style: const TextStyle(fontSize: 26, color: Colors.teal, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  const Divider(color: Colors.teal),
                  const SizedBox(height: 8),
                  const Text("Temps restant :", style: TextStyle(fontSize: 12, color: Colors.black54)),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildTimeUnit(_timeLeft.inDays, "Jours"),
                      _buildTimeUnit(_timeLeft.inHours.remainder(24), "Heures"),
                      _buildTimeUnit(_timeLeft.inMinutes.remainder(60), "Min"),
                      _buildTimeUnit(_timeLeft.inSeconds.remainder(60), "Sec", isRed: true),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            if (_winnerMessage != null)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.amber.shade100,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.amber.shade400),
                ),
                child: Text(_winnerMessage!, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.brown)),
              ),

            if (_isExpired)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Text("⛔ Cette enchère est définitivement clôturée.", textAlign: TextAlign.center, style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
              )
            else ...[
              if (_errorMessage != null)
                Padding(padding: const EdgeInsets.only(bottom: 12), child: Text(_errorMessage!, style: const TextStyle(color: Colors.red))),
              if (_successMessage != null)
                Padding(padding: const EdgeInsets.only(bottom: 12), child: Text(_successMessage!, style: const TextStyle(color: Colors.green))),

              TextField(
                controller: _bidController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: "Votre offre en Fbu (min > ${_currentHighestBid.toStringAsFixed(0)})",
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.gavel),
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: _placeBid,
                icon: const Icon(Icons.gavel, color: Colors.white),
                label: const Text("Placer mon enchère", style: TextStyle(fontSize: 16, color: Colors.white)),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, padding: const EdgeInsets.symmetric(vertical: 14)),
              ),
            ],

            const SizedBox(height: 24),

            // Historique des enchères (Pseudo, Heure, Somme)
            Text("Historique des enchères (${_bidsHistory.length})", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            _isLoadingBids
                ? const Center(child: CircularProgressIndicator())
                : _bidsHistory.isEmpty
                    ? Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
                        child: const Text("Aucune enchère placée pour le moment. Soyez le premier !", style: TextStyle(color: Colors.grey, fontSize: 13)),
                      )
                    : ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _bidsHistory.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final bid = _bidsHistory[index];
                          final isTop = index == 0;
                          final bidderName = bid['bidder_name'] ?? 'Enchérisseur #${bid['user_id'] ?? ''}';
                          final amount = double.tryParse(bid['amount'].toString()) ?? 0;

                          return Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isTop ? Colors.teal.shade50 : Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: isTop ? Colors.teal.shade400 : Colors.grey.shade300),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Flexible(
                                            child: Text("👤 $bidderName", style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14), overflow: TextOverflow.ellipsis),
                                          ),
                                          if (isTop) ...[
                                            const SizedBox(width: 6),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(color: Colors.teal.shade700, borderRadius: BorderRadius.circular(10)),
                                              child: const Text("Meilleure offre", style: TextStyle(color: Colors.white, fontSize: 10)),
                                            ),
                                          ],
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text("🕒 ${_formatBidTime(bid['created_at'])}", style: TextStyle(color: Colors.grey.shade600, fontSize: 11)),
                                    ],
                                  ),
                                ),
                                Text("${amount.toStringAsFixed(0)} Fbu", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.teal.shade800)),
                              ],
                            ),
                          );
                        },
                      ),

            const SizedBox(height: 20),
            CarbonImpactCard(category: widget.listingCategory),
            const SizedBox(height: 16),
            const Text("Description de l'article", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(widget.listingDescription, style: const TextStyle(fontSize: 15, color: Colors.black87)),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeUnit(int value, String label, {bool isRed = false}) {
    return Column(
      children: [
        Text(
          value.toString().padLeft(2, '0'),
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: isRed ? Colors.red.shade700 : Colors.teal.shade900,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Colors.grey),
        ),
      ],
    );
  }
}