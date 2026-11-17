import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  late IO.Socket socket;

  static const String serverUrl = "https://ntunte-backend.onrender.com";

  void initSocket() {
    socket = IO.io(
      serverUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build(),
    );

    socket.connect();

    socket.onConnect((_) {
      print('✅ Connecté au serveur WebSocket en temps réel');
    });

    socket.onDisconnect((_) {
      print('❌ Déconnecté du serveur WebSocket');
    });
  }

  // Rejoindre une salle d'enchères spécifique
  void joinAuction(int listingId) {
    socket.emit('join_auction', listingId);
  }

  // Écouter les nouvelles enchères en temps réel
  void onNewBid(Function(dynamic) callback) {
    socket.on('new_bid', callback);
  }

  // Placer une offre d'enchère en direct avec pseudo optionnel
  void placeBid({
    required int listingId,
    required int userId,
    required double amount,
    String? bidderName,
  }) {
    socket.emit('place_bid', {
      'listingId': listingId,
      'userId': userId,
      'amount': amount,
      if (bidderName != null && bidderName.isNotEmpty) 'bidder_name': bidderName,
    });
  }

  void disconnect() {
    socket.dispose();
  }
}