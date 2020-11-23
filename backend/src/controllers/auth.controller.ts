import { Request, Response } from "express";
import User from "../models/user"

async function login(req: Request, res: Response) {
    const name = req.body.name;
    const password = req.body.password;
    let user = await User.findOne({ $or: [{ "name": name }, { "email": name }]});

    if(!user) return res.status(404).json({message: "User not found"});
    else{
        if(user.password != password) return res.status(409).json({message: "Password don't match"});
        else return res.status(200).json(user);
    }
}

async function register(req:Request, res:Response) {
    let name = req.body.name;
    let email = req.body.email;
    let checkUsername = await User.findOne({"name":name});
    let checkEmail = await User.findOne({"email":email});

    if(checkUsername) return res.status(409).json({code: 409, message: "Username already exists"});
    else if (checkEmail) return res.status(410).json({code: 410, message: "Email already exists"});
    else {
        const user = new User({
            "name": req.body.name,
            "sex": req.body.sex,
            "image": req.body.image,
            "email": req.body.email,
            "password": req.body.password
        });
        user.save().then((data) => {
            return res.status(201).json(data);
        }).catch((err) => {
            return res.status(500).json(err);
        })
    }
}

function signout(req:Request, res:Response){

}



export default { login, register, signout };