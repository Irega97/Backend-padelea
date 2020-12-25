import { Request, Response } from "express";
import User from "../models/user";

function getMyNotifications(req:Request, res:Response): void {
    const getlength = req.body.getlength; 
    User.findById(req.user, {notifications : 1}).then((data)=>{
        let status: number = 200;
        if(data==null) status = 404;
        if (getlength) return res.status(status).json({"length": data?.notifications.length});
        else return res.status(status).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

async function addNotification(type: String, description: String, destino: String, origen: any): Promise<any> {
    let newNotification = {
        type: type,
        description: description,
        status: 0,
        origen: origen
    }
    return User.updateOne({"_id": destino}, {$addToSet: {notifications: newNotification}})
}

async function deleteNotification(type: String, destino: String, origen: any): Promise<any> {
    await User.findById(destino, {notifications: 1}).then(data => {
        data?.notifications.forEach((notification) => {
            if(notification.type == type && notification.origen == origen){
                data.notifications.splice(data.notifications.indexOf(origen), 1);
            }
        });
        return User.updateOne({"_id": destino}, {$set: {notifications: data?.notifications}})
    })
}

export default { getMyNotifications, addNotification, deleteNotification }