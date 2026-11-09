import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import userRoutes from './modules/users/user.routes';
import listingRoutes from './modules/listings/listing.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('Serveur Ntunte en ligne ! 🚀');
});

app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);

export default app;