import { Request, Response } from "express";
import User from "../models/user";

function getNotificationsMyUser(req:Request, res:Response): void {
    User.findById(req.user, {notifications : 1}).then((data)=>{
        let status: number = 200;
        if(data==null) status = 404;
        return res.status(status).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

async function addNotification(type: String, destino: String, origen: any): Promise<number> {
    let newNotification = {
        type: type,
        description:"Alguien quiere ser tu amigo",
        status: 0,
        origen: origen
    }
    console.log("Notificacion", newNotification);
    await User.findOneAndUpdate({"_id": destino}, {$addToSet: {notifications: newNotification}}).then(data => {
        return 0;
    })

    return -1;
}

export default { getNotificationsMyUser, addNotification }