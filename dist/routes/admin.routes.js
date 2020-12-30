"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = __importDefault(require("../controllers/admin.controller"));
// Router nos permite gestionar rutas de la API
const router = express_1.Router();
router.get('/:name/cola', admin_controller_1.default.getColaPlayers);
router.post('/:name/cola', admin_controller_1.default.acceptPlayers);
// Exportamos router para usar rutas en app.ts
exports.default = router;
