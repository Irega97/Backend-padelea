"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const torneo_controller_1 = __importDefault(require("../controllers/torneo.controller"));
//Router nos permite gestionar rutas de la API
const router = express_1.Router();
router.get('all', passport_1.default.authenticate("jwt", { session: false }), torneo_controller_1.default.getTorneos);
router.get('all/:username', passport_1.default.authenticate("jwt", { session: false }), torneo_controller_1.default.getTorneosUser);
router.get(':name', passport_1.default.authenticate("jwt", { session: false }), torneo_controller_1.default.getTorneo);
router.post('new', passport_1.default.authenticate("jwt", { session: false }), torneo_controller_1.default.createTorneo);
router.post('join/:name', passport_1.default.authenticate("jwt", { session: false }), torneo_controller_1.default.joinTorneo);
exports.default = router;
