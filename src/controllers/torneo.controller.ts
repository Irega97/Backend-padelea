import { Request, Response } from "express";
import Torneo from "../models/torneo";
import User from "../models/user";

async function getTorneo(req: Request, res: Response){
    const torneoID = req.params.id;
    Torneo.findById(torneoID).populate({path: 'players admin', populate:{path:'user', select: 'name username image'}}).then((data) => {
        if (data==null) return res.status(404).json({message: 'Torneo not found'});
        return res.status(200).json(data);
    }, (error) => {
        return res.status(500).json(error);
    })
}

async function getTorneos(req: Request, res: Response){
    Torneo.find({}).then((data) => {
        if (data==null) return res.status(404).json({message: 'Torneo not found'});
        return res.status(200).json(data);
    }, (error) => {
        return res.status(500).json(error);
    });
}

async function getMyTorneos(req: Request, res: Response){
    User.findById(req.user, {select: {torneos: 1}}).populate('torneos').then((data) => {
        if(data==null) return res.status(404).json({message: "Torneos no encontrados"});
        return res.status(200).json(data);
    });
}

async function createTorneo(req: Request, res: Response){
    let name = req.body.name;
    let admin = req.user;
    let torneo = new Torneo({
        name: name,
        admin: [{user: admin}],
        players: [{user: admin}]
    })
    torneo.save().then((data) => {
        if (data == null) return res.status(500).json({message: "Error"})
        User.updateOne({"_id": req.user}, {$addToSet: {torneos : torneo}}).then(user => {
            if (user == null) return res.status(500).json({message: "Error"});
        }, error =>{
            return res.status(500).json(error);
        });
        return res.status(201).json(data);
    });
}

async function joinTorneo(req: Request, res: Response){
    try{
        let t = await Torneo.findById(req.params.id);
        await User.findById(req.user).then(data => {
            console.log("eo", data);
            User.updateOne({"_id": req.user}, {$addToSet: {torneos: t}}).then(user => {
                console.log("user: ", user);
                if(user.nModified == 1){
                    Torneo.updateOne({"_id": t?._id},{$addToSet: {players: {user: data}}}).then(torneo => {
                        console.log("torneo: ", torneo);
                        if(torneo.nModified == 1) return res.status(200).json(torneo);
                        else return res.status(400).json({message: "Ya estás inscrito"});
                    });
                } else return res.status(400).json({message: "Ya estás inscrito"});
            });
        });
    } catch(error){
        return res.status(500).json(error);
    }
}

export default { getTorneo, getTorneos, getMyTorneos, createTorneo, joinTorneo }