import { Request, Response } from "express";
import User from "../models/user";

function getFriends(req:Request, res:Response): void {
    User.findById(req.params.id, {friends : 1}).then((data)=>{
        let status: number = 200;
        if(data==null) status = 404;
        return res.status(status).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

function getMyFriends(req:Request, res:Response): void {
    User.findById(req.user, {friends : 1}).then((data)=>{
        let status: number = 200;
        if(data==null) status = 404;
        return res.status(status).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

//DUDAS FRIENDS
/*
-> Porque no nos lee el include y nos los añade más de una vez si hacemos la peticion again?
-> Porque el changeStatus nos da 200 OK pero no actualiza los datos?
*/

//PULSAR EL BOTON SI NO SOIS AMIGOS

async function addFriend(req: Request, res: Response) {
    const myID = req.user;
    const receptorID = req.params.idfriend;
    let friend1 = {
        user: receptorID,
        status: 0
    };
    let friend2 = {
        user: req.user,
        status: 1
    };
    User.findById(myID).then(data => {
        if(!data?.friends.includes(friend2.user)){
            try {
                User.findOneAndUpdate({"_id":myID},{$addToSet: {friends: friend1}}).then(() => {
                    User.findOneAndUpdate({"_id":receptorID},{$addToSet: {friends: friend2}}).then(() => {
                        return res.status(200).json({message: "Amigo añadido correctamente"});
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
    const friendID = req.params.idfriend;

    await User.findById(myID, {friends : 1}).then((data) => {
        data?.friends.forEach((friend) => {
            if(friend.user == friendID){ 
                if(accept === true){
                    friend.status = 2;
                } else{
                    let i = data.friends.indexOf(friend);
                    data.friends.splice(i, 1);
                }
            }
        });
        User.updateOne({"_id": myID}, {$set: {friends: data?.friends}}).then(null, error =>{
            return res.status(500).json(error);
        });    
    });

    await User.findById(friendID, {friends: 1}).then((data) => {
        data?.friends.forEach((friend) => {
            if(friend.user == myID){ 
                if(accept === true){
                    friend.status = 2;
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
    const friendID = req.params.idfriend;

    await User.findById(myID, {friends: 1}).then((data) => {
        data?.friends.forEach((friend) => {
            if(friend.user == friendID && friend.status == 2){
                data.friends.splice(data.friends.indexOf(friendID), 1);
            }
        });
        User.updateOne({"_id": myID}, {$set: {friends: data?.friends}}).then(null, error => {
            return res.status(500).json(error);
        });
    });

    await User.findById(friendID, {friends: 1}).then((data) => {
        data?.friends.forEach((friend) => {
            if(friend.user == myID && friend.status == 2){
                data.friends.splice(data.friends.indexOf(friendID), 1);
            }
        });
        User.updateOne({"_id": friendID}, {$set: {friends: data?.friends}}).then(null, error => {
            return res.status(500).json(error);
        });
    });

    return res.status(200).json();
}

export default { getFriends, getMyFriends, addFriend, changeFriendStatus, delFriend }