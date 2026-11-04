import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class AuctionLiveScreen extends StatefulWidget {
  final int listingId;
  final String title;
  final double initialPrice;
  final int currentUserId;

  const AuctionLiveScreen({
    Key? key,
    required this.listingId,
    required this.title,
    required this.initialPrice,
    required this.currentUserId,
  }) : super(key: key);

  @override
  _AuctionLiveScreenState createState() => _AuctionLiveScreenState();
}

class _AuctionLiveScreenState extends State<AuctionLiveScreen> {
  late IO.Socket socket;
  late double currentHighestBid;
  final TextEditingController _bidController = TextEditingController();
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    currentHighestBid = widget.initialPrice;
    _initWebSocket();
  }

  void _initWebSocket() {
    // Connexion au serveur Node.js Ntunte
    socket = IO.io('http://YOUR_BACKEND_IP:5000', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });

    socket.connect();

    socket.onConnect((_) {
      print('Connecté au serveur WebSocket des enchères');
      // Rejoindre la salle de l'enchère spécifique
      socket.emit('join_auction', widget.listingId);
    });

    // Écouter les nouvelles enchères en direct
    socket.on('new_bid_broadcast', (data) {
      if (mounted) {
        setState(() {
          currentHighestBid = double.parse(data['current_highest_bid'].toString());
          errorMessage = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Nouvelle enchère placée en direct !"),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );
      }
    });

    // Gérer les erreurs de soumission d'enchère
    socket.on('bid_error', (data) {
      if (mounted) {
        setState(() {
          errorMessage = data['message'];
        });
      }
    });
  }

  void _placeBid() {
    final double? bidAmount = double.tryParse(_bidController.text);
    if (bidAmount == null || bidAmount <= currentHighestBid) {
      setState(() {
        errorMessage = "Votre offre doit être supérieure à $currentHighestBid BIF";
      });
      return;
    }

    // Émission de l'événement d'enchère
    socket.emit('place_bid', {
      'listingId': widget.listingId,
      'userId': widget.currentUserId,
      'amount': bidAmount,
    });

    _bidController.clear();
  }

  @override
  void dispose() {
    socket.disconnect();
    socket.dispose();
    _bidController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: Colors.teal,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              color: Colors.teal.shade50,
              elevation: 3,
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    const Text("Offre Actuelle la plus Haute", style: TextStyle(fontSize: 16)),
                    const SizedBox(height: 8),
                    Text(
                      "${currentHighestBid.toStringAsFixed(0)} BIF",
                      style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.teal),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            if (errorMessage != null)
              Container(
                padding: const EdgeInsets.all(10),
                color: Colors.red.shade100,
                child: Text(errorMessage!, style: const TextStyle(color: Colors.red)),
              ),
            const SizedBox(height: 16),
            TextField(
              controller: _bidController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: "Saisir votre enchère (BIF)",
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.gavel),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _placeBid,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.teal,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text("Placer mon enchère", style: TextStyle(fontSize: 18, color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}