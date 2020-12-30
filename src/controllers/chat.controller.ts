import { Request, Response } from "express";
import User from "../models/user";

function getChat(req:Request, res:Response): void {
    User.findById(req.user, {chats : 1}).populate({path: 'chats', populate: 
    {path: 'user', select: 'username image'}}).then((data)=>{ 
        if(data==null) return res.status(404).json();
        data.chats.forEach(chat => {
            if(req.params.id == chat._id){
                return res.status(200).json(chat);
            }
        })
        return res.status(409).json({message: "No perteneces a este chat"});
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

function addChat(req:Request, res:Response): void {
    User.findById(req.user, {chats : 1}).populate({path: 'chats', populate:
    {path: 'user', select: 'username image'}}).then((data) =>{

        /*if (data==null){
            let chat = new Chat ({users : req.body.participantes});
            chat.save().then((data)=>{
                return res.status(200).json(data);
            })
        }*/
    })
}
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

export default{getChat, getMyChats, addChat, /*addOtroParti,*/ delChat }