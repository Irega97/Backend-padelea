"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const friends_controller_1 = __importDefault(require("../controllers/friends.controller"));
const passport_1 = __importDefault(require("passport"));
//Router nos permite gestionar rutas de la API
const router = express_1.Router();
// FRIENDS ROUTES
router.get('/:username', passport_1.default.authenticate("jwt", { session: false }), friends_controller_1.default.getFriends);
router.post('/:username', passport_1.default.authenticate("jwt", { session: false }), friends_controller_1.default.addFriend);
router.post('/:username/status', passport_1.default.authenticate("jwt", { session: false }), friends_controller_1.default.changeFriendStatus);
router.delete('/:username', passport_1.default.authenticate("jwt", { session: false }), friends_controller_1.default.delFriend);
exports.default = router;
