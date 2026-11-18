"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const listing_routes_1 = __importDefault(require("./modules/listings/listing.routes"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes")); // Ajustez le chemin selon l'emplacement de votre fichier auth.routes.ts
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes principales
app.use('/api/listings', listing_routes_1.default);
app.use('/api/auth', auth_routes_1.default); // 👈 Ajout des routes d'authentification
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', message: 'Ntunte Backend en ligne' });
});
exports.default = app;
