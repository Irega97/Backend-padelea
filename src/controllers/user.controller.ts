import { Request, Response } from "express";
import User from "../models/user";

function getUsers(req:Request, res:Response): void {
    User.find({}).then((data)=>{
        let status: number = 200;
        if(data==null) status = 404;
        return res.status(status).json(data);
    }).catch((err) => {
        console.log(err);
        return res.status(500).json(err);
    })
}


function getUser(req:Request, res:Response): void {
    User.findById(req.params.id).populate('friends').then((data)=>{
        let status: number = 200;
        if(data==null) status = 404;
        return res.status(status).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

function getMyUser(req:Request, res:Response): void {
    User.findById(req.user).then((data)=>{
        let status: number = 200;
        if(data==null) status = 404;
        return res.status(status).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

function updateUser (req: Request, res: Response){
    const id: string = req.params.id;
    const name: string = req.body.name;
    const username: string = req.body.username;
    const email: string = req.body.email;
    User.update({"_id": id}, {$set: {"name": name, "username": username, "email": email, 
                              "image": req.body.image, "password": req.body.password, "online": true, "public": req.body.public, "provider": req.body.provider, "friends": req.body.friends}}).then((data) => {
        res.status(201).json(data);
    }).catch((err) => {
        res.status(500).json(err);
    })
} 

function deleteUser (req:Request,res:Response){
    User.deleteOne({"_id":req.params.id}).then((data:any) => {
        res.status(200).json(data);
    }).catch((err:any) => {
        res.status(500).json(err);
    })
}

function changeUsername (req:Request, res:Response){
    const userID = req.user;
    const newUsername = req.params.username;
    User.findById({"_id": userID}).then((data:any) => {
            User.update({"_id": userID}, {$set: {"name": data?.name, "username": newUsername, "image": data?.image, "email": data?.email, 
                        "password": data?.password, "provider": data?.provider, "friends": data?.friends, "online": data?.online, "public": data?.public}})
            .then((data: any) => {
                return res.status(201).json(data);
            }).catch((err: any) => {
                return res.status(500).json(err);
            })
    });
}

//DUDAS FRIENDS
/*
-> Porque no nos lee el include y nos los añade más de una vez si hacemos la peticion again?
-> Porque el changeStatus nos da 200 OK pero no actualiza los datos?
*/

//PULSAR EL BOTON SI NO SOIS AMIGOS
async function addFriend(req: Request, res: Response) {
    const myID: any = req.user;
    const receptorID = req.params.idfriend;
    let friend1 = {
        user: receptorID,
        status: 0
    };
    let friend2 = {
        user: req.user,
        status: 1
    };
    console.log("friends: ", friend1, friend2);
    User.findById(myID).then(data => {
        if(!data?.friends.includes(friend1)){
            try {
                User.findOneAndUpdate({"_id":myID},{$addToSet: {friends: friend1}}).then(() => {
                    User.findOneAndUpdate({"_id":receptorID},{$addToSet: {friends: friend2}}).then(() => {
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

export default { getUsers, getUser, updateUser, deleteUser, changeUsername, getMyUser, addFriend, changeFriendStatus, delFriend };