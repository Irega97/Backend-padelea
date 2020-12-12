import { Request, Response } from "express";
import User from "../models/user";

function getUsers(req:Request, res:Response): void {
    User.find({}, {username : 1, image : 1}).then((data)=>{
        if(data==null) return res.status(404).json({message: "Users not found"});
        data.forEach((item) => {
            let i = data.indexOf(item)
            if(req.user == item.id)
                data.splice(i,1);
        })
        return res.status(200).json(data);
    }).catch((err) => {
        console.log(err);
        return res.status(500).json(err);
    })
}

async function getUser(req:Request, res:Response) { //Usuari, Correo, Foto, Online (AMIGOS)
    let me = await User.findById(req.user, {friends: 1});
    User.findById(req.params.id, {username : 1, image : 1, email : 1}).then((data)=>{
        if(data==null) return res.status(404).json({message: "User not found"});
        let friendStatus = -1;
        me?.friends.forEach((item) => {
            console.log(item);
            if(item._id == req.params.id){
                friendStatus = item.status
            }
        });
        let dataToSend = {
            username: data.username,
            image: data.image,
            email: data.email,
            friendStatus: friendStatus
        }
        return res.status(200).json(dataToSend);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

function getMyUser(req:Request, res:Response): void {
    User.findById(req.user, {username: 1, name: 1, image: 1, email: 1, firstName: 1, lastName: 1, provider: 1}).then((data)=>{
        let status: number = 200;
        if(data==null) status = 404;
        return res.status(status).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

async function updateUser (req: Request, res: Response){
    const id = req.user;

    let checkUsername = await User.findOne({"username": req.body.username});
    let checkEmail = await User.findOne({"email": req.body.email});

    if(checkUsername && checkUsername?._id != id) return res.status(409).json({code: 409, message: "Username already exists"});
    else if (checkEmail && checkEmail?._id != id) return res.status(410).json({code: 410, message: "Email already exists"});
    else {
        const name: string = req.body.name;
        const firstName: string = req.body.firstName;
        const lastName: string = req.body.lastName;
        const username: string = req.body.username;
        const email: string = req.body.email;
        if (req.body.password == ""){
            await User.update({"_id": id}, {$set: {"name": name, "firstName": firstName, "lastName": lastName, "username": username, "email": email, 
                                "image": req.body.image, "public": req.body.public}}).then((data) => {
            res.status(201).json(data);
        }).catch((err) => {
            res.status(500).json(err);
        })
        }
        else{
            await User.update({"_id": id}, {$set: {"name": name, "firstName": firstName, "lastName": lastName, "username": username, "email": email, 
            "image": req.body.image, "password": req.body.password, "public": req.body.public}}).then((data) => {
            res.status(201).json(data);
            }).catch((err) => {
            res.status(500).json(err);
            })
        }
    }
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

export default { getUsers, getUser, updateUser, deleteUser, changeUsername, getMyUser };