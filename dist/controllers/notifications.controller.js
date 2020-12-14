"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("../models/user"));
function getMyNotifications(req, res) {
    user_1.default.findById(req.user, { notifications: 1 }).then((data) => {
        let status = 200;
        if (data == null)
            status = 404;
        return res.status(status).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    });
}
function addNotification(type, destino, origen) {
    return __awaiter(this, void 0, void 0, function* () {
        let newNotification = {
            type: type,
            description: "Alguien quiere ser tu amigo",
            status: 0,
            origen: origen
        };
        return user_1.default.updateOne({ "_id": destino }, { $addToSet: { notifications: newNotification } });
    });
}
exports.default = { getMyNotifications, addNotification };
