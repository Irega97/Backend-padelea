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
    const getlength = req.body.getlength;
    user_1.default.findById(req.user, { notifications: 1 }).then((data) => {
        let status = 200;
        if (data == null)
            status = 404;
        if (getlength)
            return res.status(status).json({ "length": data === null || data === void 0 ? void 0 : data.notifications.length });
        else
            return res.status(status).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    });
}
function addNotification(type, description, destino, origen, image) {
    return __awaiter(this, void 0, void 0, function* () {
        let newNotification = {
            type: type,
            description: description,
            status: 0,
            origen: origen,
            image: image
        };
        return user_1.default.updateOne({ "username": destino }, { $addToSet: { notifications: newNotification } });
    });
}
function deleteNotification(type, destino, origen) {
    return __awaiter(this, void 0, void 0, function* () {
        yield user_1.default.findById(destino, { notifications: 1 }).then(data => {
            data === null || data === void 0 ? void 0 : data.notifications.forEach((notification) => {
                if (notification.type == type && notification.origen == origen) {
                    data.notifications.splice(data.notifications.indexOf(origen), 1);
                }
            });
            return user_1.default.updateOne({ "_id": destino }, { $set: { notifications: data === null || data === void 0 ? void 0 : data.notifications } });
        });
    });
}
exports.default = { getMyNotifications, addNotification, deleteNotification };
