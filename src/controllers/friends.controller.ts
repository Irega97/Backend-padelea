import { Request, Response } from "express";
import User from "../models/user";
import notController from "./notifications.controller";


function getFriends(req:Request, res:Response): void {
    User.findOne({username: req.params.username}, {friends : 1}).populate({path: 'friends', populate: 
    {path: 'user', select: 'username image'}}).then((data)=>{ 
        
        if(data==null) return res.status(404).json();
        data.friends.forEach(friend => {
            if(friend.status != 2){
                let i = data.friends.indexOf(friend);
                data.friends.splice(i,1);
            }
        })
        return res.status(200).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

async function addFriend(req: Request, res: Response) {
    const myID = req.user;
    let myUser: any;
    await User.findById(myID).then((data) => {
        myUser = data?.username;
    })
    let receptorID: any;
    await User.findOne({username: req.params.username}).then((data) => {
        receptorID = data?._id
    })
    let friend1 = {
        user: receptorID,
        status: 0
    };
    let friend2 = {
        user: req.user,
        status: 1
    };
    User.findById(myID).then(data => {
        const image = data?.image;
        if(!data?.friends.includes(friend2.user)){
            try {
                User.findOneAndUpdate({"_id":myID},{$addToSet: {friends: friend1}}).then(() => {
                    User.findOneAndUpdate({"_id":receptorID},{$addToSet: {friends: friend2}}).then(() => {
                        let newNotification = {
                            type: "Amigos",
                            description: myUser + " quiere ser tu amigo",
                            status: 0,
                            origen: myUser,
                            image: image
                        }
                        User.updateOne({"_id": receptorID}, {$addToSet: {notifications: newNotification}}).then(data =>{
                            if (data.nModified == 1){
                                const io = require('../sockets/socket').getSocket()
                                io.to(receptorID).emit('nuevaNotificacion', newNotification);
                                return res.status(200).json({message: "Amigo añadido correctamente"});
                            }
                            else if (data.nModified == 0){
                                return res.status(200).json({message: "Error al guardar la notificacion"});
                            }
                            else{
                                return res.status(500).json(data);
                            }
                        })
                    });
                });
            } catch (err) {
                return res.status(500).json(err);
            }
        } else {
            return res.status(401).json({message: "Solicitud ya enviada"});
        }
    }); 
}

async function changeFriendStatus(req: Request, res: Response){
    const accept: boolean = req.body.accept;
    const myID: any = req.user;
    let myUser: any;
    let myImage: any;
    
    await User.findById(myID, {username: 1, friends : 1, image: 1}).populate({path: 'friends', populate: {path:'user', select: 'username'}}).then((data) => {
        myUser = data?.username;
        myImage = data?.image;
        data?.friends.forEach((friend) => {
            if(friend.user.username == req.params.username){
                if(accept == true){
                    friend.status = 2;
                } else{
                    let i = data.friends.indexOf(friend);
                    data.friends.splice(i, 1);
                }
            } 
        });
        notController.deleteNotification("Amigos", myID, req.params.username).then(null, error =>{
            return res.status(500).json(error);
        });
        User.updateOne({"_id": myID}, {$set: {friends: data?.friends}}).then(null, error =>{
            return res.status(500).json(error);
        });    
    });

    await User.findOne({username: req.params.username}, {friends: 1}).then((data) => {
        let friendID = data?.id;
        data?.friends.forEach((friend) => {
            if(friend.user == myID){ 
                if(accept === true){
                    friend.status = 2;
                    let newNotification = {
                        type: "Amigos",
                        description: myUser + " te ha aceptado como amigo",
                        status: 1,
                        origen: myUser,
                        image: myImage
                    }
                    User.updateOne({"_id": friendID}, {$addToSet: {notifications: newNotification}}).then(data =>{
                        if (data.nModified == 1){
                            const io = require('../sockets/socket').getSocket()
                            io.to(friendID).emit('nuevaNotificacion', newNotification);
                        }
                        
                        else{
                            return res.status(500).json(data);
                        }
                    });
                } else{
                    let i = data.friends.indexOf(friend);
                    data.friends.splice(i, 1);
                }
            }
        });
        User.updateOne({"_id": friendID}, {$set: {friends: data?.friends}}).then(null, error =>{
            return res.status(500).json(error);
        });
    });
    
    return res.status(200).json({message: "Succesfully updated"});
}

async function delFriend(req: Request, res: Response){
    const myID: any = req.user;
    const username: any = req.params.username;
    let friendID: any;

    await User.findById(myID, {friends: 1}).populate({path: 'friends', populate: {path:'user', select: 'username'}}).then((data) => {
        data?.friends.forEach((friend) => {
            if(friend.user.username == username && friend.status == 2){
                data.friends.splice(data.friends.indexOf(friendID), 1);
            }
        });
        User.updateOne({"_id": myID}, {$set: {friends: data?.friends}}).then(null, error => {
            return res.status(500).json(error);
        });
    });

    await User.findOne({username: username}, {friends: 1}).then((data) => {
        data?.friends.forEach((friend) => {
            if(friend.user == myID && friend.status == 2){
                data.friends.splice(data.friends.indexOf(friendID), 1);
            }
        });
        User.updateOne({"username": username}, {$set: {friends: data?.friends}}).then(null, error => {
            return res.status(500).json(error);
        });
    });

    return res.status(200).json();
}

export default { getFriends, addFriend, changeFriendStatus, delFriend }