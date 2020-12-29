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
        let user = req.body.player;
        let accept = req.body.accept;
        Torneo.findOne({'name': req.params.name}, {players: 1, cola: 1}).populate({path: 'cola', select: 'name image'}).then((data) => {
            if(accept == true){
                data?.cola.forEach((p) => {
                    if(p.name == user) user;
                });
            } else {
                data?.cola.forEach((p) => {
                    if(p.name == user)
                        data.cola.splice(data.cola.indexOf(p), 1);
                });
            }
            Torneo.findOneAndUpdate({'name': req.params.name}, {$set: {players: data?.players, cola: data?.cola}}).then((d) => {
                if(d == null) return res.status(400).json({message: "Bad request"});
                return res.status(200).json(d);
            })
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Internal Server Error"});
    }
}

export default { getColaPlayers, acceptPlayers };