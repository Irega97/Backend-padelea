import { Request, Response } from "express";
import User from "../models/user";

function getNotifications(req:Request, res:Response): void {
    User.findById(req.user, {notifications : 1}).then((data)=>{
        let status: number = 200;
        if(data==null) status = 404;
        console.log(data);
        return res.status(status).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

export default { getNotifications }