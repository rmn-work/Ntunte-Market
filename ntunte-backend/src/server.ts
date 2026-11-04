import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupAuctionSocket } from './modules/auctions/auction.gateway';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // À restreindre en production vers votre site Next.js & App Flutter
    methods: ["GET", "POST"]
  }
});

// Initialiser les WebSockets pour les enchères
setupAuctionSocket(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur Ntunte démarré sur le port ${PORT}`);
});