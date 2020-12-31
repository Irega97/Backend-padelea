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
    user_1.default.findById(req.user, { chats: 1 }).populate({ path: 'chats', populate: { path: 'users', select: 'username image online' } }).then((data) => {
        if (data == null)
            return res.status(404).json();
        data.chats.forEach((chat) => {
            if (tipo == "user" && (chat.users[0].username == name || chat.users[1].username == name)) {
                dataToSend = {
                    existe: true,
                    chat: chat
                };
                existe = true;
            }
            else if (tipo == "grupo" && chat.name == name) {
                dataToSend = {
                    existe: true,
                    chat: chat
                };
                existe = true;
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
    user_1.default.findById(req.user, { chats: 1 }).populate({ path: 'chats', populate: { path: 'users', select: 'username image' } }).then((data) => {
        if (data == null)
            return res.status(404).json();
        return res.status(200).json(data);
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
    chat.save().then((data) => {
        chat.users.forEach((user) => {
            user_1.default.findOneAndUpdate({ "_id": user }, { $addToSet: { chats: data } }).then(() => {
                const sockets = require('../sockets/socket').getVectorSockets();
                sockets.forEach((socket) => {
                    if (socket._id == user) {
                        socket.join(data._id);
                        const io = require('../sockets/socket').getSocket();
                        io.to(user).emit('nuevoMensaje', data.mensajes[0]);
                    }
                });
            });
        });
        return res.status(200).json(data);
    });
}
/*User.findById(req.user, {chats : 1}).populate({path: 'chats', populate:
{path: 'user', select: 'username image'}}).then((data) =>{

    /*if (data==null){
        let chat = new Chat ({users : req.body.participantes});
        chat.save().then((data)=>{
            return res.status(200).json(data);
        })
    }
})*/
/*
async function  addOtroParti(req:Request, res:Response): void {
    
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
                const io = require('../sockets/socket').getSocket();
                io.to(req.params.id).emit('nuevoMensaje', req.body);
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
exports.default = { getChat, getMyChats, addChat, sendMessage, /*addOtroParti,*/ delChat, getIdMyChats };
