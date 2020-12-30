"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = __importDefault(require("../controllers/user.controller"));
const passport_1 = __importDefault(require("passport"));
//Router nos permite gestionar rutas de la API
const router = express_1.Router();
//Si no esta logeado, no le dejara ver los usuarios
router.get('/all', passport_1.default.authenticate("jwt", { session: false }), user_controller_1.default.getUsers);
router.get('/me', passport_1.default.authenticate("jwt", { session: false }), user_controller_1.default.getMyUser);
router.get('/me/num', passport_1.default.authenticate("jwt", { session: false }), user_controller_1.default.getMyNum);
router.get('/:username', passport_1.default.authenticate("jwt", { session: false }), user_controller_1.default.getUser);
router.post('/me', passport_1.default.authenticate("jwt", { session: false }), user_controller_1.default.updateUser);
//router.post('/:id', userController.updateUser);
router.delete('/:username', passport_1.default.authenticate("jwt", { session: false }), user_controller_1.default.deleteUser);
//Exportamos router para usar rutas en app.ts
exports.default = router;
