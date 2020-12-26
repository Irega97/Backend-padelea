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

function getMyFriends(req:Request, res:Response): void {
    User.findById(req.user, {friends : 1}).populate({path: 'friends', populate:
    {path: 'user', select: '_id username image'}}).then((data)=>{
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

//DUDAS FRIENDS
/*
-> Porque no nos lee el include y nos los añade más de una vez si hacemos la peticion again?
-> Porque el changeStatus nos da 200 OK pero no actualiza los datos?
*/

//PULSAR EL BOTON SI NO SOIS AMIGOS

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
        if(!data?.friends.includes(friend2.user)){
            try {
                User.findOneAndUpdate({"_id":myID},{$addToSet: {friends: friend1}}).then(() => {
                    User.findOneAndUpdate({"_id":receptorID},{$addToSet: {friends: friend2}}).then(() => {
                        notController.addNotification("Amigos", "Alguien quiere ser tu amigo", req.params.username, myUser).then(data =>{
                            if (data.nModified == 1){
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
    
    let friendID: any;
    await User.findOne({username: req.params.username}).then((data) => {
        friendID = data?._id;
    })

    //ESTA MIERDA NO VA
    await User.findById(myID, {friends : 1}).then((data) => {
        data?.friends.forEach((friend) => {
            if(friend.user == friendID){ //PETA AQUI EL MUY HIJO DE PUTA
                if(accept == true){
                    friend.status = 2;
                } else{
                    let i = data.friends.indexOf(friend);
                    data.friends.splice(i, 1);
                }
            } else console.log("hello")
        });
        notController.deleteNotification("Amigos", myID, req.params.username).then(null, error =>{
            return res.status(500).json(error);
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
    let friendID: any;
    await User.findOne({username: req.params.username}).then((data) => {
        friendID = data?._id;
    })

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