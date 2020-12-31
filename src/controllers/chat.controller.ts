import { Request, Response } from "express";
import User, { IUser } from "../models/user";
import Chat from '../models/chat';

function getChat(req:Request, res:Response): void {
    let tipo = req.body.tipo;
    let name = req.body.name;
    let existe: Boolean = false;
    let dataToSend: any;
    User.findById(req.user, {chats : 1}).populate({path: 'chats', populate: {path: 'users', select: 'username image online'}}).then((data:any)=>{ 
        if(data==null) return res.status(404).json();
        data.chats.forEach((chat:any) => {
            if(tipo == "user" && (chat.users[0].username == name || chat.users[1].username == name)){
                dataToSend = {
                    existe: true,
                    chat: chat
                }
                existe = true;
            }
            
            else if (tipo == "grupo" && chat.name == name){
                dataToSend = {
                    existe: true,
                    chat: chat
                }
                existe = true;
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
    {path: 'user', select: 'username image'}}).then((data)=>{
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

    chat.save().then((data) => {
        chat.users.forEach((user) => {
            User.findOneAndUpdate({"_id":user},{$addToSet: {chats: data}}).then(() => {
                const sockets = require('../sockets/socket').getVectorSockets();
                sockets.forEach((socket: any) =>{
                    if (socket._id == user){
                        socket.join(data._id);
                        const io = require('../sockets/socket').getSocket();
                        io.to(user).emit('nuevoMensaje', data.mensajes[0]);
                    }
                })
            });
        })
        return res.status(200).json(data);
    })
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

function sendMessage(req:Request, res:Response): void {
    let enc: Boolean = false;
    Chat.findById(req.params.id).populate({path: 'users', select: 'username'}).then(data => {
        data?.users.forEach((user) => {
            if (req.body.sender == user.username)
                enc = true;
        })

        if (enc){
            Chat.findOneAndUpdate({"_id":req.params.id}, {$addToSet: {mensajes: req.body}}).then(data => {
                const io = require('../sockets/socket').getSocket()
                io.to(req.params.id).emit('nuevoMensaje', req.body);
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