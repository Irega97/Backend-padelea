import { Request, Response } from "express";
import chat from "../models/chat";
import Chat from "../models/chat";
import User from "../models/user";

function  getChat(req:Request, res:Response): void {
    User.findById(req.params.id, {chats : 1}).populate({path: 'chats', populate: 
    {path: 'user', select: 'username image'}}).then((data)=>{ 
        
        if(data==null) return res.status(404).json();
        data.chats.forEach(chat => {
            if(chat.status != 2){
                let i = data.chats.indexOf(chat);
                data.chats.splice(i,1);
            }
        })
        return res.status(200).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

function  getMyChats(req:Request, res:Response): void {
    User.findById(req.user, {chats : 1}).populate({path: 'chats', populate:
    {path: 'user', select: '_id username image'}}).then((data)=>{
        if(data==null) return res.status(404).json();
        data.chats.forEach(chat => {
            let i = data.chats.indexOf(chat);
            data.chats.splice(i,1);
        })
        return res.status(200).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

function  addChat(){
    
}

function  addOtroParti(){
    
}

function  delChat(){
    
}

export default{getChat, getMyChats, addChat, addOtroParti, delChat}