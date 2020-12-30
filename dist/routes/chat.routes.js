"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = __importDefault(require("../controllers/chat.controller"));
const passport_1 = __importDefault(require("passport"));
//Router nos permite gestionar rutas de la API
const router = express_1.Router();
// FRIENDS ROUTES
router.get('/:id', passport_1.default.authenticate("jwt", { session: false }), chat_controller_1.default.getChat);
router.get('/me/all', passport_1.default.authenticate("jwt", { session: false }), chat_controller_1.default.getMyChats);
router.post('/new', passport_1.default.authenticate("jwt", { session: false }), chat_controller_1.default.addChat);
router.delete('/:id', passport_1.default.authenticate("jwt", { session: false }), chat_controller_1.default.delChat);
exports.default = router;
