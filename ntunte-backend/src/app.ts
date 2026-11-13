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

// Route pour la politique de confidentialité (requise par Google Play)
app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Politique de Confidentialité - Ntunte Market</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; line-height: 1.6; }
            h1 { color: #111; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            h3 { color: #444; margin-top: 20px; }
            p { color: #666; }
        </style>
    </head>
    <body>
        <h1>Politique de Confidentialité - Ntunte Market</h1>
        <p><strong>Dernière mise à jour :</strong> Novembre 2026</p>

        <p>Ntunte Market édite l'application mobile <strong>Ntunte</strong>. Cette application est une marketplace permettant de consulter, publier des annonces et placer des enchères au Burundi.</p>

        <h3>1. Données collectées</h3>
        <p>Nous collectons uniquement les informations de base nécessaires au service : les informations de compte, les annonces publiées et les offres d'enchères que vous effectuez.</p>

        <h3>2. Utilisation des données</h3>
        <p>Vos données sont utilisées exclusivement pour assurer le bon fonctionnement du service de mise en relation entre acheteurs et vendeurs.</p>

        <h3>3. Sécurité</h3>
        <p>Toutes vos données sont stockées de manière sécurisée et ne sont jamais vendues, louées ou partagées à des tiers à des fins commerciales.</p>

        <h3>4. Contact</h3>
        <p>Pour toute question relative à cette politique de confidentialité, vous pouvez nous contacter directement via l'application.</p>
    </body>
    </html>
  `);
});

app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);

export default app;