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

// Route de santé (recommandée pour Render)
app.get('/', (req, res) => {
  res.status(200).send('Serveur Ntunte en ligne ! 🚀');
});

// Initialiser les WebSockets pour les enchères
setupAuctionSocket(io);

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur Ntunte démarré sur le port ${PORT}`);
});