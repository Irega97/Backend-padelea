import { Request, Response } from "express";
import User from "../models/user";
import Torneo from "../models/torneo";

async function getColaPlayers(req: Request, res: Response){
    try {
        Torneo.findOne({'name': req.params.name}, {cola: 1}).populate({path: 'cola', select: 'username name image'}).then((data) => {
            if(data==null) return res.status(404).json({message: "Cola not found"});
            return res.status(200).json(data);
        })
    } catch(err){
        console.log(err);
        return res.status(500).json({message: "Internal Server Error"});
    }
}

async function acceptPlayers(req: Request, res: Response){
    try {
        let user = req.body.user;
        let accept = req.body.accept;
        let userID: string;
        let torneoID: string;
        let message: string;

        const io = require('../sockets/socket').getSocket()

        await Torneo.findOne({'name': req.params.name}, {maxPlayers: 1, players: 1, cola: 1}).populate({path: 'cola', select: 'username'}).then((data) => {
            torneoID = data?.id;
            data?.cola.forEach((p) => {
                if(p.username == user){
                    userID = p._id;
                    data.cola.splice(data.cola.indexOf(p), 1);
                    if(accept==true) data?.players.push(userID);
                }
            });
            Torneo.findOneAndUpdate({'name': req.params.name}, {$set: {players: data?.players, cola: data?.cola}}).then((d) => {
                if(d == null) return res.status(400).json({message: "Bad request"});
                else {
                    User.findById(userID, {torneos: 1, username: 1, name: 1, image: 1}).populate('torneos').then((user) => {
                        if(user == null) return res.status(404).json({message: "User not found"});
                        user?.torneos.forEach((t) => {
                            if(t.torneo == torneoID)
                                if(accept == true) t.status = 1;
                                else user.torneos.splice(user.torneos.indexOf(t), 1);
                        });
                        User.update({"_id": userID}, {$set: {torneos: user?.torneos}}).then((data) => {
                            if(data.nModified != 1) return res.status(400).json({message: "Bad request"});
                            if(accept == true) {
                                message = "Usuario aceptado";

                                let playerToSend = {
                                    torneo: req.params.name,
                                    username: user.username,
                                    name: user.name,
                                    image: user.image
                                }
                                io.emit('nuevoJugador', playerToSend);

                                let newNotification = {
                                    type: "Torneo",
                                    description: "Has sido aceptado en " + req.params.name,
                                    status: 1,
                                    origen: req.params.name,
                                    image: d.image
                                }
                                User.updateOne({"_id": userID}, {$addToSet: {notifications: newNotification}}).then(data =>{
                                    if (data.nModified == 1)
                                        io.to(userID).emit('nuevaNotificacion', newNotification);
                                });
                            }
                            else 
                                message = "Usuario rechazado";
                                
                            return res.status(200).json({message: message});
                        });
                    });
                }
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Internal Server Error"});
    }
}

export default { getColaPlayers, acceptPlayers };