"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chat_1 = __importDefault(require("../models/chat"));
const user_1 = __importDefault(require("../models/user"));
function getChat(req, res) {
    user_1.default.findById(req.user, { chats: 1 }).populate({ path: 'chats', populate: { path: 'user', select: 'username image' } }).then((data) => {
        if (data == null)
            return res.status(404).json();
        data.chats.forEach(chat => {
            if (req.params.id == chat._id) {
                return res.status(200).json(chat);
            }
        });
        return res.status(409).json({ message: "No perteneces a este chat" });
    }).catch((err) => {
        return res.status(500).json(err);
    });
}
function getMyChats(req, res) {
    user_1.default.findById(req.user, { chats: 1 }).populate({ path: 'chats', populate: { path: 'user', select: 'username image' } }).then((data) => {
        if (data == null)
            return res.status(404).json();
        return res.status(200).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    });
}
function addChat(req, res) {
    user_1.default.findById(req.user, { chats: 1 }).populate({ path: 'chats', populate: { path: 'user', select: 'username image' } }).then((data) => {
        if (data == null) {
            let chat = new chat_1.default({ users: req.body.participantes });
            chat.save().then((data) => {
                return res.status(200).json(data);
            });
        }
    });
}
function addOtroParti() {
}
function delChat() {
}
exports.default = { getChat, getMyChats, addChat, addOtroParti, delChat };
