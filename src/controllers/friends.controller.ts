import { Request, Response } from "express";
import User from "../models/user";

//ESTO ESTA HECHO PARA HACERLO EN DOS RUTAS; NO HACE FALTA ENVIAR TODO EN EL AddFriends();
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

function changeFriendStatus(req: Request, res: Response){
    const myID: any = req.user;
    const friendID = req.params.idfriend;
    let friend1 = {
        user: friendID,
        status: 1
    };
    let friend2 = {
        user: req.user,
        status: 0
    };
    console.log("friends: ", friend1, friend2);
    User.findById(myID).then(data => {
        if(!data?.friends.includes(friend1)){
            try {
                User.findOneAndUpdate({"_id":myID},{$set: {"friends.$[status].value" : 2}},
                                    {arrayFilters: [friend1]}).then(() => {
                    User.findOneAndUpdate({"_id":friendID},{$set: {"friends.$.[status].value": 2}},
                                    {arrayFilters: [friend2]}).then(() => {
                        return res.status(200).json();
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

async function delFriend(req: Request, res: Response){
    const myID: any = req.user;
    const friendID = req.params.idfriend;
    let friend1 = {
        user: friendID,
        status: 2
    };
    let friend2 = {
        user: req.user,
        status: 2
    };
    console.log("friends: ", friend1, friend2);
    try {
        User.findOneAndUpdate({"_id":myID},{$pull: {friends: friend1}}).then(data => {
            console.log("1. ", data);
        });
        User.findOneAndUpdate({"_id":friendID},{$pull: {friends: friend2}}).then(d => {
            console.log("2. ", d);
        });
        return res.status(200).json();
    } catch (err) {
        return res.status(500).json(err);
    }
}

export default { getFriends, getMyFriends, addFriend, changeFriendStatus, delFriend }