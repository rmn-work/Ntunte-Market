"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
exports.redisClient.on('error', (err) => console.error('Erreur de connexion Redis :', err));
(async () => {
    await exports.redisClient.connect();
    console.log('Connecté à Redis pour les enchères en temps réel.');
})();
