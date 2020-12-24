"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("../models/user"));
function getChat(req, res) {
    user_1.default.findById(req.params.id, { chats: 1 }).populate({ path: 'chats', populate: { path: 'user', select: 'username image' } }).then((data) => {
        if (data == null)
            return res.status(404).json();
        data.chats.forEach(chat => {
            if (chat.status != 2) {
                let i = data.chats.indexOf(chat);
                data.chats.splice(i, 1);
            }
        });
        return res.status(200).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    });
}
function getMyChats(req, res) {
    user_1.default.findById(req.user, { chats: 1 }).populate({ path: 'chats', populate: { path: 'user', select: '_id username image' } }).then((data) => {
        if (data == null)
            return res.status(404).json();
        data.chats.forEach(chat => {
            let i = data.chats.indexOf(chat);
            data.chats.splice(i, 1);
        });
        return res.status(200).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    });
}
function addChat() {
}
function addOtroParti() {
}
function delChat() {
}
exports.default = { getChat, getMyChats, addChat, addOtroParti, delChat };
