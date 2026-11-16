"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const listing_routes_1 = __importDefault(require("./modules/listings/listing.routes")); // Ajustez le chemin selon votre arborescence
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes principales
app.use('/api/listings', listing_routes_1.default);
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', message: 'Ntunte Backend en ligne' });
});
exports.default = app;
