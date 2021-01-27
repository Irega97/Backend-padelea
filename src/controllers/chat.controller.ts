import { Request, Response } from "express";
import User from "../models/user";
import Chat from '../models/chat';

function getChat(req:Request, res:Response): void {
    let tipo = req.body.tipo;
    let name = req.body.name;
    let existe: Boolean = false;
    let dataToSend: any;

    User.findById(req.user, {chats : 1}).populate({path: 'chats', populate: {path: 'chat' , populate: 
    {path: 'users', select: 'username image online'}}}).then((data:any)=>{ 
        if(data==null) return res.status(404).json();
        data.chats.forEach((chat:any) => {
            if(tipo == "user" && chat.chat.name == undefined && (chat.chat.users[0].username == name || chat.chat.users[1].username == name)){
                dataToSend = {
                    existe: true,
                    chat: chat
                }
                existe = true;
            }
            
            else if (tipo == "grupo" && chat.chat.name == name){
                dataToSend = {
                    existe: true,
                    chat: chat
                }
                existe = true;
            } 
        })

        if (existe){
            leerChat(dataToSend.chat.chat._id, req.user).then((data:number) => {
                if (data != -1){
                    if (data == 1){
                        let info = {
                            "chat": dataToSend.chat.chat._id,
                            "user": req.user,
                            "ultimoleido": dataToSend.chat.ultimoleido
                        }
                        const io = require('../sockets/socket').getSocket()
                        io.to(dataToSend.chat.chat._id).emit('mensajeLeido', info);
                    }
                    return res.status(200).json(dataToSend);
                }
                    
                else
                    return res.status(500).json(data);
            });
        }
        
        else{
            if (tipo == "user"){
                User.findOne({"username":name}, {username : 1, image : 1, online: 1}).then((data)=>{
                    dataToSend = {
                        existe: false,
                        user: data
                    }
                    return res.status(200).json(dataToSend);
                });
            }  
    
            else{
                return res.status(409).json({message: "No perteneces a este chat"});
            }
        }
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

function getMyChats(req:Request, res:Response): void {
    User.findById(req.user, {chats : 1}).populate({path: 'chats', populate:
    {path: 'chat', populate: {path: 'users', select: 'username image'}}}).then((data)=>{
        if(data==null) return res.status(404).json();
        return res.status(200).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

function getChatsSinLeer(req: Request, res:Response): void {
    let chatsSinLeer: string[] = []
    User.findById(req.user, {chats: 1}).populate({path: 'chats', populate: {path: 'chat'}}).then(data => {
        data?.chats.forEach(chat => {
            if (chat.ultimoleido < chat.chat.mensajes.length)
                chatsSinLeer.push(chat.chat._id);
        })
        return res.status(200).json(chatsSinLeer);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

function addAdmin(req:Request, res:Response): void {
    let enc: Boolean = false;
    let adm: Boolean = false;
    Chat.findById(req.params.id).then(data => {
        data?.admin.forEach(admin => {
            if (admin == req.user){
                data.users.forEach(user => {
                    if (user == req.body.user._id)
                        enc = true;
                })
            }
            if (req.body.user._id == admin)
                adm = true;
        })
        if (enc && !adm){
            let message: any = {
                body : req.body.admin + " ha hecho administrador a " + req.body.user.username,
                date: new Date(Date.now()),
                leidos: []
            }

            Chat.findOneAndUpdate({"_id":req.params.id}, {$addToSet: {admin: req.body.user._id, mensajes: message}}).then(() => {
                let info = {
                    message: message,
                    admin: req.body.user._id,
                    chat: req.params.id
                }
                const io = require('../sockets/socket').getSocket()
                io.to(req.params.id).emit('nuevoAdmin', info);
                return res.status(200).json({message:message.body});
            })
        }
        else
            return res.status(409).json({message: "No puedes hacer al usuario admin del grupo"});
    })
}

function getIdMyChats(id: string): any {
    return User.findById(id, {chats:1}).populate('chats');
}

function leerChat(idChat: any, idUser: any): Promise<number> {
    let enc: Boolean = false;
    return new Promise(function (resolve) {
        User.findById(idUser, {chat: 1}).populate({path: 'chats', populate: {path: 'chat'}}).then(data => {
            data?.chats.forEach(chat=> {
                if (chat.chat._id.toString() == idChat.toString()){
                    while (chat.ultimoleido < chat.chat.mensajes.length){
                        chat.chat.mensajes[chat.ultimoleido].leidos.push(idUser);
                        chat.ultimoleido++;
                    }

                    enc = true;
                    Chat.updateOne({"_id": idChat}, {$set: {mensajes: chat.chat.mensajes}}).then(() => {
                        User.updateOne({"_id": idUser}, {$set: {chats: data.chats}}).then(() => {
                            resolve(1);
                        })
                    })
                }
            })
            if (!enc)
                resolve(0);
        }).catch((err) => {
            resolve(-1);
        });
    })
}

async function addChat(req:Request, res:Response) {
    let chat = new Chat({
        users: req.body.users,
        name: req.body.name,
        admin: req.body.admin,
        image: req.body.image,
        mensajes: req.body.mensaje
    });

    let chatuser = {
        chat: chat,
        ultimoleido: 0
    }
    if (chat.name != undefined){
        let checkName = await Chat.findOne({"name": chat.name});
        if(checkName) return res.status(409).json({code: 409, message: "Name already exists"});
    }

    chat.save().then((data) => {
        Chat.populate(data, {path: 'users', select: 'username image'}, () => {
            chatuser.chat = data;
            chat.users.forEach((user) => {
                if (user._id == req.user)
                    chatuser.ultimoleido = 1;
                else
                    chatuser.ultimoleido = 0;
    
                User.findOneAndUpdate({"_id":user._id},{$addToSet: {chats: chatuser}}).then(() => {
                    const sockets = require('../sockets/socket').getVectorSockets();
                    sockets.forEach((socket: any) =>{
                        if (socket._id == user._id){
                            socket.join(data._id);
                            const io = require('../sockets/socket').getSocket();
                            io.to(user._id).emit('nuevoChat', chatuser.chat);
                        }
                    })
                });
            })
            return res.status(200).json(data);
        });
    })
}

function sendMessage(req:Request, res:Response): void {
    let enc: Boolean = false;
    Chat.findById(req.params.id).populate({path: 'users', select: 'username'}).then(data => {
        data?.users.forEach((user) => {
            if (req.body.sender == user.username)
                enc = true;
        })

        if (enc){
            Chat.findOneAndUpdate({"_id":req.params.id}, {$addToSet: {mensajes: req.body}}).then(data => {
                let mensaje = {
                    chat: req.params.id,
                    mensaje: req.body
                }
                const io = require('../sockets/socket').getSocket()
                io.to(req.params.id).emit('nuevoMensaje', mensaje);
                User.findById(req.user, {chats: 1}).then(data => {
                    data?.chats.forEach(chat => {
                        if (chat.chat == req.params.id){
                            chat.ultimoleido++;
                        }
                    })
                    User.updateOne({"_id": req.user}, {$set: {chats: data?.chats}}).then(() => {
                        return res.status(200).json({message: "Recibido"});
                    }, error =>{
                        return res.status(500).json(error);
                    }); 
                })
            })
        }
        else{
            return res.status(409).json({message: "No perteneces a este chat"});
        }
    })
}

async function abandonarChat(req:Request, res:Response) {
    let chatBBDD = await Chat.findOne({"_id": req.params.id});
    User.findOne({"_id": req.user}, {chats: 1, username: 1}).then(data => {
        data?.chats.forEach(chat => {
            if (chat.chat.toString() == req.params.id.toString()){
                data.chats.splice(data.chats.indexOf(chat), 1);

                chatBBDD?.users.forEach((user:any) => {
                    if (user == req.user){
                        chatBBDD?.users.splice(chatBBDD.users.indexOf(user), 1);
                        
                        let message:any = {
                            body : data.username + " ha abandonado el chat",
                            date: new Date(Date.now()),
                            leidos: [],
                        }

                        Chat.updateOne({"_id": req.params.id}, {$set: {users: chatBBDD?.users}, $addToSet: {mensajes: message}}).then(() => {
                            User.updateOne({"_id": req.user}, {$set: {chats: data.chats}}).then(() => {
                                let mensaje = {
                                    chat: req.params.id,
                                    mensaje: message
                                }

                                const io = require('../sockets/socket').getSocket()
                                io.to(req.params.id).emit('nuevoMensaje', mensaje);
                                let info = {
                                    chat: req.params.id,
                                    user: req.user
                                }
                                io.to(req.params.id).emit('abandonopart', info);
                                return res.status(200).json({message: "Abandonado"});
                            })
                        })
                    }
                })
            }
        })
    })
}

//function addParticipante(req:Request, res:Response): void {}

/*function delChat(req:Request, res:Response): void {
    User.findById(req.user, {chats : 1}).populate({path: 'chats', populate: 
    {path: 'user', select: 'username'}}).then((data)=>{ 
        if(data==null) return res.status(404).json();
        data.chats.forEach(chat => {
            if(req.params.id == chat._id){
                User.deleteOne({ idChat: 'idChat' }, function (err) {
                    return res.status(409).json(err);
                  });
                return res.status(200).json(chat);
            }
        })
    }).catch((err) => {
        return res.status(500).json(err);
    })
}*/

export default{getChat, getMyChats, getChatsSinLeer, addChat, sendMessage, leerChat, addAdmin, abandonarChat, /*addParticipante,*/ /*delChat,*/ getIdMyChats }