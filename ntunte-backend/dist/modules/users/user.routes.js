"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const router = (0, express_1.Router)();
// Utilisez UserController.register au lieu de registerUser
router.post('/register', user_controller_1.UserController.register);
exports.default = router;
