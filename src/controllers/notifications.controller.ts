import { Request, Response } from "express";
import User from "../models/user";

function getMyNotifications(req:Request, res:Response): void {
    User.findById(req.user, {notifications : 1}).then((data)=>{
        let status: number = 200;
        if(data==null) status = 404;
        return res.status(status).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

async function addNotification(type: String, destino: String, origen: any): Promise<any> {
    let newNotification = {
        type: type,
        description:"Alguien quiere ser tu amigo",
        status: 0,
        origen: origen
    }
    return User.updateOne({"_id": destino}, {$addToSet: {notifications: newNotification}})
}

export default { getMyNotifications, addNotification }