import { Request, Response } from "express";
import Torneo from "../models/torneo";
import User from "../models/user";

async function getTorneo(req: Request, res: Response){
    const torneo = req.params.name;
    const userID = req.user;
    let joined = false;
    let isAdmin = false;
    let inscription = false;
    Torneo.findOne({'name': torneo}).populate({path: 'players admin', select: 'name username image'}).then((data) => {
        if (data==null) return res.status(404).json({message: 'Torneo not found'});
        data.admin.forEach((admin)=>{
            if(admin._id == userID) isAdmin = true;
        })
        data.players.forEach((player) => {
            if(player._id == userID) joined = true;
        });
        if(data.finInscripcion.valueOf() - Date.now() > 0) inscription = true;
        let dataToSend = {
            torneo: data,
            isAdmin: isAdmin,
            joined: joined,
            inscription: inscription
        }
        return res.status(200).json(dataToSend);
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
    User.findById(req.user, {select: {torneos: 1}}).populate({path: 'torneos', populate:
                    {path:'torneo', select: 'name'}}).then((data) => {
        if(data==null) return res.status(404).json({message: "Torneos no encontrados"});
        return res.status(200).json(data);
    });
}

async function createTorneo(req: Request, res: Response){
    let name = req.body.name;

    let checkName = await Torneo.findOne({"name": name});
    if(checkName) return res.status(409).json("Este torneo ya existe");

    let user = req.user;
    let type = req.body.type;
    let description = req.body.description;
    let fechaInicio = req.body.fechaInicio;
    let finInscripcion = req.body.finInscripcion;
    let ubicacion = req.body.ubicacion;
    let reglamento = req.body.reglamento;
    let numRondas = req.body.numRondas;
    let maxPlayers = req.body.maxPlayers;
    let participa = req.body.participa;
    let torneo = new Torneo({
        name: name,
        type: type,
        description: description,
        fechaInicio: fechaInicio,
        finInscripcion: finInscripcion,
        ubicacion: ubicacion,
        reglamento: reglamento,
        numRondas: numRondas,
        admin: [user],
        maxPlayers: maxPlayers,
        players: [user]
    });
    if(participa==false){
        torneo.players = [];
    }
    torneo.save().then((data) => {
        if(participa == true){
            User.updateOne({"_id": req.user}, {$addToSet: {torneos : {torneo: data.id, statistics: null, status: 1}}}).then(user => {
                if (user == null) return res.status(404).json({message: "User not found"});
            }, (error) =>{
                console.log(error);
                return res.status(500).json({message: "Internal Server Error"});
            });
        }
        return res.status(201).json(data);
    }, (error) =>{
        console.log(error);
        return res.status(500).json({message: "Internal Server Error"});
    });
}

async function joinTorneo(req: Request, res: Response){
    try{
        let t = await Torneo.findOne({'name': req.params.name});
        let tID = t?.id;
        let inscriptionsPeriod;
        User.findById(req.user).then(async data => {
            if(t!=null){
                if(t.finInscripcion.valueOf()-Date.now() > 0){
                    inscriptionsPeriod = true;
                } else inscriptionsPeriod = false;
                if(t?.players.length < t?.maxPlayers && inscriptionsPeriod && t.type == "public"){
                    await Torneo.updateOne({"_id": t?._id},{$addToSet: {players: data?.id}}).then(torneo => {
                        if(torneo.nModified != 1) return res.status(400).json({message: "Ya estás inscrito"});
                        t = torneo;
                    });
                    await User.updateOne({"_id": data?._id},{$addToSet: {torneos: [{torneo: tID, statistics: null, status: 1}]}}).then(user => {
                        if(user.nModified != 1) return res.status(400).json({message: "Ya estás inscrito"});
                    });
                    return res.status(200).json(t);
                } else {
                    await Torneo.updateOne({"_id": t?._id},{$addToSet: {cola: data?.id}}).then(torneo => {
                        if(torneo.nModified != 1) return res.status(400).json({message: "Ya estás inscrito"});
                        t = torneo;
                    });
                    await User.updateOne({"_id": data?._id},{$addToSet: {torneos: [{torneo: tID, statistics: null, status: 0}]}}).then(user => {
                        if(user.nModified != 1) return res.status(400).json({message: "Ya estás inscrito"});
                    });
                    return res.status(200).json(t);
                }
            }
            else return res.status(404).json({message: "Torneo not found"});
        });
    } catch(error){
        console.log(error);
        return res.status(500).json({message: "Internal Server Error"});
    }
}

export default { getTorneo, getTorneos, getMyTorneos, createTorneo, joinTorneo }