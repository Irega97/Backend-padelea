import { Request, Response } from "express";
import User from "../models/user";
import Chat from '../models/chat';

function getChat(req:Request, res:Response): void {
    let tipo = req.body.tipo;
    let name = req.body.name;
    let existe: Boolean = false;
    let dataToSend: any;

    User.findById(req.user, {chats : 1}).populate({path: 'chats', populate: {path: 'chat' , populate : 
    {path: 'users', select: 'username image online'}}}).then((data:any)=>{ 
        if(data==null) return res.status(404).json();
        data.chats.forEach((chat:any) => {
            if(tipo == "user" && (chat.chat.users[0].username == name || chat.chat.users[1].username == name)){
                const chatToSend = chat;
                dataToSend = {
                    existe: true,
                    chat: chatToSend
                }
                existe = true;
            }
            
            else if (tipo == "grupo" && chat.name == name){
                const chatToSend = chat;
                dataToSend = {
                    existe: true,
                    chat: chatToSend
                }
                existe = true;
            } 

            if (chat.ultimoleido < chat.chat.mensajes.length){
                let i: number = chat.ultimoleido;
                while (i < chat.chat.mensajes.length){
                    chat.chat.mensajes[i].leidos.push(req.user);
                    i++;
                }
                chat.ultimoleido = i;
                Chat.updateOne({"_id": chat.chat._id}, {$set: {mensajes: chat.chat.mensajes}}).then(() => {
                    User.updateOne({"_id": req.user}, {$set: {chats: data?.chats}}).then(null, error =>{
                        return res.status(500).json(error);
                    }); 
                }, error =>{
                    return res.status(500).json(error);
                });
            }
        })

        if (existe){
            return res.status(200).json(dataToSend);
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

function getIdMyChats(id: string): any {
    return User.findById(id, {chats:1}).populate('chats')
}

function addChat(req:Request, res:Response): void {
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

    chat.save().then((data) => {
        chatuser.chat = data;
        chat.users.forEach((user) => {
            if (user == req.user && req.body.mensaje != undefined)
                chatuser.ultimoleido = 1;
            else
                chatuser.ultimoleido = 0;

            User.findOneAndUpdate({"_id":user},{$addToSet: {chats: chatuser}}).then(() => {
                const sockets = require('../sockets/socket').getVectorSockets();
                sockets.forEach((socket: any) =>{
                    if (socket._id == user){
                        socket.join(data._id);
                        const io = require('../sockets/socket').getSocket();
                        let mensaje = {
                            chat: data._id,
                            mensaje: data.mensajes[0]
                        }
                        io.to(user).emit('nuevoMensaje', mensaje);
                    }
                })
            });
        })
        return res.status(200).json(data);
    })
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
                    User.updateOne({"_id": req.user}, {$set: {chats: data?.chats}}).then(null, error =>{
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

function delChat(req:Request, res:Response): void {
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
}

export default{getChat, getMyChats, addChat, sendMessage, /*addOtroParti,*/ delChat, getIdMyChats }