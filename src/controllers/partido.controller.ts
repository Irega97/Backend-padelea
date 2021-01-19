import { Request, Response } from "express";
import config from "../config/config";
import Partido from "../models/partido";
import User from "../models/user";
import Torneo from "../models/torneo";
import { idText } from "typescript";
import user from "../models/user";
import partido from "../models/partido";

async function getPartidosTorneo(req: Request, res: Response){
    Partido.find({idTorneo: req.body.name}).then((data) => {
        if(data==null) return res.status(404).json({message: 'Partidos not found'});
        return res.status(200).json(data);
    });
}

async function getPartidosUser(req: Request, res: Response){
    User.find({"username": req.body.username}).populate('partidos').then((data) => {
        if(data == null) return res.status(404).json({message: 'Partidos not found'});
        return res.status(200).json(data);
    });
}

async function addResultados(req: Request, res: Response) {
    Partido.find({"partido":req.body.partido}).then((data) => {
        if(data == null) return res.status(404).json({message: 'Partido not found'})
        else{
            const id = partido;
            const set1:string = req.body.set1;
            const set2:string = req.body.set2;
            //Set3 no tiene que ser obligatorio, pero no se como poner para que sea opcional introducirlo
            const set3:string = req.body.set3; 

           Partido.update( {"_id": id }, {$set: {"set1":set1,"set2":set2, "set3":set3}}).then((data)  =>  {
               res.status(200).json(data);
           }).catch((err)  => {
               res.status(500).json(err);
           });
           
        }
    });
}

async function addPartido(req: Request, res: Response){
    const jugadores = req.body.jugadores;
    const torneo = req.body.torneo;
    let idTorneo: any;

    Torneo.findOne({"name": torneo}).then((data) => {
        idTorneo = data?._id;
    });

    const partido = new Partido({
        idTorneo: idTorneo,
        jugadores: [{
            pareja1: [jugadores[0], jugadores[1]],
            pareja2: [jugadores[2], jugadores[3]]
        }],
        resultado: [],
        ganadores: []
    })
    partido.save().then((p) => {
        let pID = p._id;
        for(let i=0; i<jugadores.length; i++){
            User.findOne({"_id": jugadores[i]}).then((user) => {
                user?.partidos.push(pID);
                User.updateOne({"_id": jugadores[i]}, {$set: {partidos: user?.partidos}}).then((d) => {
                    if(d.nModified != 1) return res.status(400).json({message: 'Bad update'});
                    else {
                        Torneo.update({"_id": idTorneo}, {$addToSet: {partidos: p}});
                    }
                })
            })
        }
        return res.status(200).json(p);
    })
}

export default { getPartidosTorneo, getPartidosUser, addPartido, addResultados }