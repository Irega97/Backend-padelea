import { Request, Response } from "express";
import Torneo from "../models/torneo";
import User from "../models/user";

async function getTorneo(req: Request, res: Response){
    const torneoID = req.params.id;
    Torneo.findById(torneoID).populate({path: 'admin players', select: 'name username image'}).then((data) => {
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
    User.findById(req.user, {select: {torneos: 1}}).populate({path: 'torneos', populate: '_id'}).then((data) => {
        if(data==null) return res.status(404).json({message: "Torneos no encontrados"});
        return res.status(200).json(data);
    });
}

async function createTorneo(req: Request, res: Response){
    let name = req.body.name;
    let admin = req.user;
    let torneo = new Torneo({
        name: name,
        admin: [{_id: admin}],
        players: [{_id: admin}]
    })
    torneo.save().then((data) => {
        if (data == null) return res.status(500).json({message: "Error"})
        User.updateOne({"_id": req.user}, {$set: {torneos: torneo?._id}}).then(user => {
            if (user == null) return res.status(500).json({message: "Error"});
        }, error =>{
            return res.status(500).json(error);
        });
        return res.status(201).json(data);
    });
}

async function joinTorneo(req: Request, res: Response){
    let torneo = await Torneo.findById(req.params.id);
    await User.findById(req.user, {torneos: 1}).then(data => {
        console.log(data);
        data?.torneos.forEach(torneo => {
            if(torneo._id == torneo._id) return res.status(400).json({message: "Ya estas inscrito"});
        });
        User.findByIdAndUpdate({"_id": req.user}, {$set: {torneos: torneo?._id}});
    });
    return res.status(200).json();
}

export default { getTorneo, getTorneos, getMyTorneos, createTorneo, joinTorneo }