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

async function getUser(req:Request, res:Response) { 
    const me = await User.findById(req.user, {friends: 1});
    let numTorneos=0;
    let numAmigos=0;
    User.findOne({"username":req.params.username}, {username : 1, image : 1, email : 1, online: 1, name: 1, friends: 1, torneos: 1, chat: 1}).then((data)=>{
        if(data==null) return res.status(404).json({message: "User not found"});
        let friendStatus = -1;
        me?.friends.forEach((item) => {
            if(item.user == data.id){
                friendStatus = item.status
            }
        });

        data?.friends.forEach((friend) => {
            if(friend.status == 2)
                numAmigos++;
        })

        data?.torneos.forEach((item) => {
            if(item.status != 0)
                numTorneos++;
        })

        let dataToSend = {
            _id: data._id,
            username: data.username,
            image: data.image,
            email: data.email,
            name: data.name,
            friendStatus: friendStatus,
            numAmigos: numAmigos,
            numTorneos: numTorneos
        }
        return res.status(200).json(dataToSend);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

function getMyUser(req:Request, res:Response): void {
    User.findById(req.user, {username: 1, name: 1, image: 1, email: 1, firstName: 1, lastName: 1, provider: 1, private: 1}).then((data)=>{
        let status: number = 200;
        if(data==null) status = 404;
        return res.status(status).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

function getMyNum(req:Request, res:Response): void {
    User.findById(req.user, {friends: 1, torneos: 1}). then(data => {
        let status: number = 200;
        data?.friends.forEach((friend) => {
            if(friend.status != 2)
                data.friends.splice(data.friends.indexOf(friend), 1);
        });
        data?.torneos.forEach((torneo) => {
            if(torneo.status == 0){
                data.torneos.splice(data.torneos.indexOf(torneo), 1);
            }
        })
        const dataSend = {
            numAmigos: data?.friends.length,
            numTorneos: data?.torneos.length
        }
        return res.status(status).json(dataSend);
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
                                "image": req.body.image, "private": req.body.private}}).then((data) => {
            res.status(201).json(data);
        }).catch((err) => {
            res.status(500).json(err);
        })
        }
        else{
            await User.update({"_id": id}, {$set: {"name": name, "firstName": firstName, "lastName": lastName, "username": username, "email": email, 
            "image": req.body.image, "password": req.body.password, "private": req.body.private}}).then((data) => {
            res.status(201).json(data);
            }).catch((err) => {
            res.status(500).json(err);
            })
        }
    }
} 

function deleteUser (req:Request,res:Response){
    User.deleteOne({"username":req.params.username}).then((data:any) => {
        res.status(200).json(data);
    }).catch((err:any) => {
        res.status(500).json(err);
    })
}

export default { getUsers, getUser, updateUser, deleteUser, getMyUser, getMyNum };