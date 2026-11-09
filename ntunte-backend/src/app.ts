import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import userRoutes from './modules/users/user.routes';
import listingRoutes from './modules/listings/listing.routes'; // Assurez-vous que le chemin pointe bien vers votre fichier listing.routes.ts

const app = express();

app.use(cors());
app.use(express.json());

// Route de santé
app.get('/', (req, res) => {
  res.status(200).send('Serveur Ntunte en ligne ! 🚀');
});

// Montage des routes de l'API
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes); // C'est ici qu'on active /api/listings et /api/listings/nearby

export default app;