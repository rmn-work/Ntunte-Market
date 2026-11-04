import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // En production, activez le SSL si requis par votre hébergeur
});

pool.on('connect', () => {
  console.log('Connexion établie avec succès à la base de données PostgreSQL / PostGIS (Ntunte).');
});

export const query = (text: string, params?: any[]) => pool.query(text, params);