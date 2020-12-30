"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const notifications_controller_1 = __importDefault(require("../controllers/notifications.controller"));
//Router nos permite gestionar rutas de la API
const router = express_1.Router();
router.post('/me', passport_1.default.authenticate("jwt", { session: false }), notifications_controller_1.default.getMyNotifications);
router.post('/del', passport_1.default.authenticate("jwt", { session: false }), notifications_controller_1.default.delNotification);
exports.default = router;
