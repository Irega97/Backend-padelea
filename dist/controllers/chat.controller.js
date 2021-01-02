"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("../models/user"));
const chat_1 = __importDefault(require("../models/chat"));
function getChat(req, res) {
    let tipo = req.body.tipo;
    let name = req.body.name;
    let existe = false;
    let dataToSend;
    user_1.default.findById(req.user, { chats: 1 }).populate({ path: 'chats', populate: { path: 'chat', populate: { path: 'users', select: 'username image online' } } }).then((data) => {
        if (data == null)
            return res.status(404).json();
        data.chats.forEach((chat) => {
            if (tipo == "user" && (chat.chat.users[0].username == name || chat.chat.users[1].username == name)) {
                const chatToSend = chat;
                const ultimoleido = chat.ultimoleido;
                dataToSend = {
                    existe: true,
                    chat: chatToSend,
                    ultimoleido: ultimoleido
                };
                existe = true;
            }
            else if (tipo == "grupo" && chat.name == name) {
                const chatToSend = chat;
                const ultimoleido = chat.ultimoleido;
                dataToSend = {
                    existe: true,
                    chat: chatToSend,
                    ultimoleido: ultimoleido
                };
                existe = true;
            }
            if (chat.ultimoleido < chat.chat.mensajes.length) {
                let i = chat.ultimoleido;
                while (i < chat.chat.mensajes.length) {
                    chat.chat.mensajes[i].leidos.push(req.user);
                    i++;
                }
                chat.ultimoleido = i;
                chat_1.default.updateOne({ "_id": chat.chat._id }, { $set: { mensajes: chat.chat.mensajes } }).then(() => {
                    user_1.default.updateOne({ "_id": req.user }, { $set: { chats: data === null || data === void 0 ? void 0 : data.chats } }).then(null, error => {
                        return res.status(500).json(error);
                    });
                }, error => {
                    return res.status(500).json(error);
                });
            }
        });
        if (existe) {
            return res.status(200).json(dataToSend);
        }
        else {
            if (tipo == "user") {
                user_1.default.findOne({ "username": name }, { username: 1, image: 1, online: 1 }).then((data) => {
                    dataToSend = {
                        existe: false,
                        user: data
                    };
                    return res.status(200).json(dataToSend);
                });
            }
            else {
                return res.status(409).json({ message: "No perteneces a este chat" });
            }
        }
    }).catch((err) => {
        return res.status(500).json(err);
    });
}
function getMyChats(req, res) {
    user_1.default.findById(req.user, { chats: 1 }).populate({ path: 'chats', populate: { path: 'chat', populate: { path: 'users', select: 'username image' } } }).then((data) => {
        if (data == null)
            return res.status(404).json();
        return res.status(200).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    });
}
function getChatsSinLeer(req, res) {
    let chatsSinLeer = [];
    user_1.default.findById(req.user, { chats: 1 }).populate({ path: 'chats', populate: { path: 'chat' } }).then(data => {
        data === null || data === void 0 ? void 0 : data.chats.forEach(chat => {
            if (chat.ultimoleido < chat.chat.mensajes.length)
                chatsSinLeer.push(chat.chat._id);
        });
        return res.status(200).json(chatsSinLeer);
    }).catch((err) => {
        return res.status(500).json(err);
    });
}
function getIdMyChats(id) {
    return user_1.default.findById(id, { chats: 1 }).populate('chats');
}
function addChat(req, res) {
    let chat = new chat_1.default({
        users: req.body.users,
        name: req.body.name,
        admin: req.body.admin,
        image: req.body.image,
        mensajes: req.body.mensaje
    });
    let chatuser = {
        chat: chat,
        ultimoleido: 0
    };
    chat.save().then((data) => {
        chat_1.default.populate(data, { path: 'users', select: 'username image' }, () => {
            chatuser.chat = data;
            chat.users.forEach((user) => {
                if (user._id == req.user)
                    chatuser.ultimoleido = 1;
                else
                    chatuser.ultimoleido = 0;
                user_1.default.findOneAndUpdate({ "_id": user._id }, { $addToSet: { chats: chatuser } }).then(() => {
                    const sockets = require('../sockets/socket').getVectorSockets();
                    sockets.forEach((socket) => {
                        if (socket._id == user._id) {
                            socket.join(data._id);
                            const io = require('../sockets/socket').getSocket();
                            io.to(user._id).emit('nuevoChat', chatuser.chat);
                        }
                    });
                });
            });
            return res.status(200).json(data);
        });
    });
}
/*async function  addOtroParti(req:Request, res:Response): void {
    
    let c : any;

    await Chat.findOne({"_id": req.params.id}).then((data) => {
        if(data == null) return res.status(404).json({message: "Chat not found"});
        else {
            c = data;
        }
    });

    if(req.body.participantes =! null){
        Chat.updateOne({"_id": req.params.id}, {"users": req.params.participantes}).populate
    }
}*/
function sendMessage(req, res) {
    let enc = false;
    chat_1.default.findById(req.params.id).populate({ path: 'users', select: 'username' }).then(data => {
        data === null || data === void 0 ? void 0 : data.users.forEach((user) => {
            if (req.body.sender == user.username)
                enc = true;
        });
        if (enc) {
            chat_1.default.findOneAndUpdate({ "_id": req.params.id }, { $addToSet: { mensajes: req.body } }).then(data => {
                let mensaje = {
                    chat: req.params.id,
                    mensaje: req.body
                };
                const io = require('../sockets/socket').getSocket();
                io.to(req.params.id).emit('nuevoMensaje', mensaje);
                user_1.default.findById(req.user, { chats: 1 }).then(data => {
                    data === null || data === void 0 ? void 0 : data.chats.forEach(chat => {
                        if (chat.chat == req.params.id) {
                            chat.ultimoleido++;
                        }
                    });
                    user_1.default.updateOne({ "_id": req.user }, { $set: { chats: data === null || data === void 0 ? void 0 : data.chats } }).then(() => {
                        return res.status(200).json({ message: "Recibido" });
                    }, error => {
                        return res.status(500).json(error);
                    });
                });
            });
        }
        else {
            return res.status(409).json({ message: "No perteneces a este chat" });
        }
    });
}
function delChat(req, res) {
    user_1.default.findById(req.user, { chats: 1 }).populate({ path: 'chats', populate: { path: 'user', select: 'username' } }).then((data) => {
        if (data == null)
            return res.status(404).json();
        data.chats.forEach(chat => {
            if (req.params.id == chat._id) {
                user_1.default.deleteOne({ idChat: 'idChat' }, function (err) {
                    return res.status(409).json(err);
                });
                return res.status(200).json(chat);
            }
        });
    }).catch((err) => {
        return res.status(500).json(err);
    });
}
exports.default = { getChat, getMyChats, getChatsSinLeer, addChat, sendMessage, /*addOtroParti,*/ delChat, getIdMyChats };
