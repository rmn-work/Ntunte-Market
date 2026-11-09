import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { setupAuctionSocket } from './modules/auctions/auction.gateway';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialiser les WebSockets pour les enchères
setupAuctionSocket(io);

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur Ntunte démarré sur le port ${PORT}`);
});