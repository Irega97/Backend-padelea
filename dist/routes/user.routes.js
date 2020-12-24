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
router.get('/:id', passport_1.default.authenticate("jwt", { session: false }), user_controller_1.default.getUser);
router.post('/me', passport_1.default.authenticate("jwt", { session: false }), user_controller_1.default.updateUser);
//router.post('/:id', userController.updateUser);
router.delete('/:id', passport_1.default.authenticate("jwt", { session: false }), user_controller_1.default.deleteUser);
router.post('/setusername/:username', passport_1.default.authenticate("jwt", { session: false }), user_controller_1.default.changeUsername);
//Exportamos router para usar rutas en app.ts
exports.default = router;
