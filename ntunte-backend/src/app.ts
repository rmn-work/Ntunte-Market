import express from 'express';
import cors from 'cors';
import listingRoutes from './modules/listings/listing.routes';
import authRoutes from './modules/auth/auth.routes'; // Ajustez le chemin selon l'emplacement de votre fichier auth.routes.ts

const app = express();

app.use(cors());
app.use(express.json());

// Routes principales
app.use('/api/listings', listingRoutes);
app.use('/api/auth', authRoutes); // 👈 Ajout des routes d'authentification

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'Ntunte Backend en ligne' });
});

export default app;