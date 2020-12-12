"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
// Router nos permite gestionar rutas de la API
const router = express_1.Router();
router.post('/login', auth_controller_1.default.login);
router.post('/register', auth_controller_1.default.register);
router.put('/signout', auth_controller_1.default.signout);
router.get('/checkemail/:email', auth_controller_1.default.checkemail);
// Exportamos router para usar rutas en app.ts
exports.default = router;
