import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Erreur de connexion Redis :', err));

(async () => {
  await redisClient.connect();
  console.log('Connecté à Redis pour les enchères en temps réel.');
})();