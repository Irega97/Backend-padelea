import { Request, Response } from "express";
import User from "../models/user";
import Torneo from "../models/torneo";

async function getColaPlayers(req: Request, res: Response){
    try {
        Torneo.findOne({'name': req.params.name}, {cola: 1}).populate({path: 'cola', select: 'name image'}).then((data) => {
            console.log("cola torneo: ", data);
            /* if(data==null) return res.status(404).json({message: "Cola not found"}); */
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
        await Torneo.findOne({'name': req.params.name}, {maxPlayers: 1, players: 1, cola: 1}).populate({path: 'cola', select: 'username image'}).then((data) => {
            torneoID = data?.id;
            if(accept == true){
                data?.cola.forEach((p) => {
                    if(p.username == user){
                        userID = p._id;
                        data.cola.splice(data.cola.indexOf(p), 1);
                        data?.players.push(userID);
                    }
                });
                Torneo.findOneAndUpdate({'name': req.params.name}, {$set: {players: data?.players, cola: data?.cola}}).then((d) => {
                    if(d == null) return res.status(400).json({message: "Bad request"});
                    else {
                        User.findById(userID, {select: {torneos: 1}}).populate('torneos').then((user) => {
                            if(user == null) return res.status(404).json({message: "User not found"});
                            user?.torneos.forEach((t) => {
                                if(t.torneo == torneoID)
                                    t.status = 1;
                            });
                            User.update({"_id": userID}, {$set: {torneos: user?.torneos}}).then((d) => {
                                if(d.nModified != 1) return res.status(400).json({message: "Bad request"});
                            });
                        });
                        return res.status(200).json({message: "Usuario aceptado"});
                    }
                });
            } else {
                data?.cola.forEach((p) => {
                    if(p.username == user){
                        userID = p._id;
                        data.cola.splice(data.cola.indexOf(p), 1);
                    }
                });
                Torneo.findOneAndUpdate({'name': req.params.name}, {$set: {cola: data?.cola}}).then((d) => {
                    if(d == null) return res.status(400).json({message: "Bad request"});
                    else {
                        User.findById(userID, {select: {torneos: 1}}).populate('torneos').then((user) => {
                            if(user == null) return res.status(404).json({message: "User not found"});
                            user?.torneos.forEach((t) => {
                                if(t.torneo == torneoID)
                                    user.torneos.splice(user.torneos.indexOf(t), 1);
                            });
                            User.update({"_id": userID}, {$set: {torneos: user?.torneos}}).then((d) => {
                                if(d.nModified != 1) return res.status(400).json({message: "Bad request"});
                            });
                        });
                        return res.status(200).json({message: "Usuario rechazado"});
                    }
                });
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Internal Server Error"});
    }
}

export default { getColaPlayers, acceptPlayers };