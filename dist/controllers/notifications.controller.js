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
function delNotification(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let notificationbody = req.body.notification;
        yield user_1.default.findById(req.user, { notifications: 1 }).then(data => {
            data === null || data === void 0 ? void 0 : data.notifications.forEach((notification) => {
                if (notification.type == notificationbody.type && notification.origen == notificationbody.origen) {
                    data.notifications.splice(data.notifications.indexOf(notification.origen), 1);
                    user_1.default.updateOne({ "_id": req.user }, { $set: { notifications: data === null || data === void 0 ? void 0 : data.notifications } }).then(data => {
                        return res.status(200).json(data);
                    }, error => {
                        return res.status(500).json(error);
                    });
                }
            });
        }).catch((err) => {
            return res.status(500).json(err);
        });
    });
}
exports.default = { getMyNotifications, deleteNotification, delNotification };
