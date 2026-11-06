import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  late IO.Socket socket;

  // URL de production sur Render[cite: 1, 2]
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

  // Placer une offre d'enchère en direct
  void placeBid({required int listingId, required int userId, required double amount}) {
    socket.emit('place_bid', {
      'listingId': listingId,
      'userId': userId,
      'amount': amount,
    });
  }

  void disconnect() {
    socket.dispose();
  }
}