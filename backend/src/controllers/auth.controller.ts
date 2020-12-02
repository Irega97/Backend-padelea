import { Request, Response } from "express";
import User, { IUser } from "../models/user"
import jwt from 'jsonwebtoken';
import config from '../config/config';

async function login(req: Request, res: Response) {
    const name = req.body.name;
    const password = req.body.password;
    let user = await User.findOne({ $or: [{ "name": name }, { "email": name }]});

    if(!user) return res.status(404).json({message: "User not found"});
    else{
        if(user.password != password) return res.status(409).json({message: "Password don't match"});
        else {
            await User.updateOne({"_id":user.id}, {$set: {"_id":user.id,"name":user.name,"sex":user.sex,
                                "image":user.image, "city":user.city, "email":user.email, "password":user.password, "online":true}});
            return res.status(200).json({token: createToken(user)});
        }
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
            "image": config.defaultImage /*|| req.body.image*/,
            "city": req.body.city,
            "email": req.body.email,
            "password": req.body.password,
            "online": true
        });
        user.save().then((data) => {
            return res.status(201).json({token: createToken(data)});
        }).catch((err) => {
            return res.status(500).json(err);
        })
    }
}

async function signout(req:Request, res:Response){
    let t = decodeToken(req.body.token);
    console.log(t);
    let user = await User.findOne({"_id": t?.id});
    if(!user) return res.status(404).json({message: "User not found"});
    else {
        User.updateOne({"_id":user.id}, {$set: {"_id":user.id,"name":user.name,"sex":user.sex,
                                        "image":user.image, "city":user.city, "email":user.email, "password":user.password, "online":false}})
        .then((data: any)=>{
            return res.status(200).json(data);
        });
    }
}

function createToken(user: IUser){
    const expirationTime = 3600; //1h
    return jwt.sign({id:user.id, name: user.name, email: user.email}, config.jwtSecret, {
        expiresIn: expirationTime
    });
}

function decodeToken(token: string){ 
    return jwt.decode(token, {json: true});
}


export default { login, register, signout };