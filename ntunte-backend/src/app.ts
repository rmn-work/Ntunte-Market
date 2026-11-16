import express from 'express';
import cors from 'cors';
import listingRoutes from './modules/listings/listing.routes'; // Ajustez le chemin selon votre arborescence

const app = express();

app.use(cors());
app.use(express.json());

// Routes principales
app.use('/api/listings', listingRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'Ntunte Backend en ligne' });
});

export default app;