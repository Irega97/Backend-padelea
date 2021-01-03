import { Request, Response } from "express";
import User from "../models/user";
import Chat from '../models/chat';

function getChat(req:Request, res:Response): void {
    let tipo = req.body.tipo;
    let name = req.body.name;
    let existe: Boolean = false;
    let dataToSend: any;
    let chatToRead: any;

    User.findById(req.user, {chats : 1}).populate({path: 'chats', populate: {path: 'chat' , populate: 
    {path: 'users', select: 'username image online'}}}).then((data:any)=>{ 
        if(data==null) return res.status(404).json();
        data.chats.forEach((chat:any) => {
            if(tipo == "user" && chat.chat.name == undefined && (chat.chat.users[0].username == name || chat.chat.users[1].username == name)){
                const chatToSend = chat;
                chatToRead = chat;
                const ultimoleido = chat.ultimoleido
                dataToSend = {
                    existe: true,
                    chat: chatToSend,
                    ultimoleido: ultimoleido
                }
                existe = true;
            }
            
            else if (tipo == "grupo" && chat.chat.name == name){
                const chatToSend = chat;
                chatToRead = chat;
                const ultimoleido = chat.ultimoleido
                dataToSend = {
                    existe: true,
                    chat: chatToSend,
                    ultimoleido: ultimoleido
                }
                existe = true;
            } 
        })

        if (existe){
            if (chatToRead.ultimoleido < chatToRead.chat.mensajes.length){
                let i: number = chatToRead.ultimoleido;
                while (i < chatToRead.chat.mensajes.length){
                    chatToRead.chat.mensajes[i].leidos.push(req.user);
                    i++;
                }
                chatToRead.ultimoleido = i;
                Chat.updateOne({"_id": chatToRead.chat._id}, {$set: {mensajes: chatToRead.chat.mensajes}}).then(() => {
                    User.updateOne({"_id": req.user}, {$set: {chats: data?.chats}}).then(null, error =>{
                        return res.status(500).json(error);
                    }); 
                }, error =>{
                    return res.status(500).json(error);
                });
            }
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

function getIdMyChats(id: string): any {
    return User.findById(id, {chats:1}).populate('chats')
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

export default{getChat, getMyChats, getChatsSinLeer, addChat, sendMessage, /*addOtroParti,*/ delChat, getIdMyChats }