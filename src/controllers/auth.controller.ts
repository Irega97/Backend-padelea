import { Request, Response } from "express";
import User, { IUser } from "../models/user"
import jwt from 'jsonwebtoken';
import config from '../config/config';

async function login(req: Request, res: Response) {
    let user;
    if(req.body.provider != "formulario"){
        user = await User.findOne({"email": req.body.email});
        if(!user) return res.status(404).json({message: "User not found"});
        else {
            if (user.provider != req.body.provider) return res.status(409).json({message: "Este email está registrado pero no con esta red social"});
            let t = {token: createToken(user)}
            console.log("New token: ", t.token);
            return res.status(200).json(t);
        }
    } else {
        const username = req.body.username;
        const password = req.body.password;
        
        user = await User.findOne({ $or: [{ "username": username }, { "email": username }]});
    
        if(!user) return res.status(404).json({message: "User not found"});
        else{
            if(user.password != password) return res.status(409).json({message: "Password don't match"});
            else {
                try{
                    let t = {token: createToken(user)}
                    console.log("New token: ", t.token);
                    return res.status(200).json(t);
                } catch (err) {
                    return res.status(500).json(err);
                }
            }
        }
    }
}

async function register(req:Request, res:Response) {
    let user = req.body;
    let checkUsername = await User.findOne({"username": user.username});
    let checkEmail = await User.findOne({"email": user.email});

    if(checkUsername) return res.status(409).json({code: 409, message: "Username already exists"});
    else if (checkEmail) return res.status(410).json({code: 410, message: "Email already exists"});
    else {
        let u = new User({
            "name": user.name,
            "firstName": user.firstName,
            "lastName": user.lastName,
            "username": user.username,
            "image": user.image,
            "email": user.email,
            "password": user.password,
            "provider": user.provider,
            "online": false,
            "private": user.private
        });
        u.save().then((data) => {
            return res.status(201).json({token: createToken(data)});
        }).catch((err) => {
            return res.status(500).json(err);
        });
    }
}

async function signout(req:Request, res:Response){
    let t = decodeToken(req.body.token);
    let user = await User.findOne({"_id": t?.id});
    if(!user) return res.status(404).json({message: "User not found"});
    else {
        return res.status(200).json({message: "Usuario desconectado"});
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

async function setOnlineStatus(id: String, value: boolean){
    await User.updateOne({"_id":id}, {$set: {"online":value}});
                    
}

async function checkemail(req: Request, res: Response){
    let email = req.params.email;
    await User.findOne({'email': email}).then((data) => {
        if(data) return res.status(200).json({value: true, provider: data.provider});
        else return res.status(200).json({value: false});
    })
}

export default { login, register, signout, checkemail, setOnlineStatus };