import 'dart:async';
import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
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
    this.currentUserId = 2, // ID de test (ex: reviewer@ntunte.com)
  }) : super(key: key);

  @override
  State<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends State<ListingDetailScreen> {
  late IO.Socket _socket;
  late double _currentHighestBid;
  final TextEditingController _bidController = TextEditingController();

  // Gestion du temps et du compte à rebours
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
    // Par défaut, fin dans 24 heures pour les tests mobiles
    _endTime = DateTime.now().add(const Duration(hours: 24));
    _startCountdown();
    _initWebSocket();
  }

  void _startCountdown() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_endTime == null) return;
      final diff = _endTime!.difference(DateTime.now());
      if (diff.isNegative) {
        setState(() {
          _isExpired = true;
          _timeLeft = Duration.zero;
          _winnerMessage = "🎉 Enchère terminée ! Félicitations au vainqueur avec ${_currentHighestBid.toStringAsFixed(0)} Fbu ! 🏆";
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

    _socket.on('new_bid_broadcast', (data) {
      if (mounted && data['listingId'].toString() == widget.listingId.toString()) {
        setState(() {
          _currentHighestBid = double.parse(data['current_highest_bid'].toString());
          _errorMessage = null;
          _successMessage = "Nouvelle enchère enregistrée en direct !";
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

    _socket.emit('place_bid', {
      'listingId': widget.listingId,
      'userId': widget.currentUserId,
      'amount': bidAmount,
    });

    _bidController.clear();
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
      appBar: AppBar(
        title: Text(widget.listingTitle),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              widget.listingTitle,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
            const SizedBox(height: 6),
            Text(
              "📦 Publié récemment",
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
            const SizedBox(height: 12),

            // Encart Enchère Actuelle & Compte à rebours
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
                  Text(
                    '${_currentHighestBid.toStringAsFixed(0)} Fbu',
                    style: const TextStyle(
                      fontSize: 26,
                      color: Colors.teal,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Divider(color: Colors.teal200),
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

            // Message de félicitations au vainqueur en cas de fin d'enchère
            if (_winnerMessage != null)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.amber.shade100,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.amber.shade400),
                ),
                child: Text(
                  _winnerMessage!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.brown, fontSize: 15),
                ),
              ),

            // Formulaire ou état clôturé
            if (_isExpired)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Text(
                  "⛔ Cette enchère est définitivement clôturée.",
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 16),
                ),
              )
            else ...[
              if (_errorMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(color: Colors.red, fontWeight: FontWeight.w600),
                  ),
                ),
              if (_successMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(
                    _successMessage!,
                    style: const TextStyle(color: Colors.green, fontWeight: FontWeight.w600),
                  ),
                ),
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
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.teal,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ],

            const SizedBox(height: 20),
            CarbonImpactCard(category: widget.listingCategory),
            const SizedBox(height: 16),
            const Text(
              "Description de l'article",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              widget.listingDescription,
              style: const TextStyle(fontSize: 15, color: Colors.black87),
            ),
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