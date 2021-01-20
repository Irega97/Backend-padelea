import { request, Request, Response } from "express";
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
    const idPartido = req.body.idPartido;
    let idTorneo;
    Partido.find({"_id":idPartido}).then((data) => {
        if(data == null) return res.status(404).json({message: 'Partido not found'})
        else{
            console.log(data);
            console.log(data[0].idTorneo);
            const set1: string = req.body.set1;
            const set2: string = req.body.set2;
            //Set3 no tiene que ser obligatorio, pero no se como poner para que sea opcional introducirlo
            let set3: string;
            if(req.body.set3 != null){
                set3 = req.body.set3;
            } else set3 = ''; 
            
            let resultado: any;
            if(set3!='') resultado = {set1:set1, set2:set2, set3:set3};
            else resultado = {set1:set1, set2: set2, set3:''};
            console.log(resultado);
            
            Partido.updateOne({"_id": idPartido}, {$set: {resultado: [resultado]}}).then((data)  =>  {
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

function getPartidosGrupo(req: Request, res: Response){
    Torneo.findOne({"name": req.params.name}, {previa: 1, rondas: 1}).populate({path: 'previa rondas', populate: {path: 'grupos', 
    populate: {path: 'classification', populate: {path: 'player', select: 'username image'}}}}).then((data) => {
        if (data != undefined){
            let dataToSend;
            let enc: Boolean = false;
            let i: number = 0;
            if (req.params.vuelta == "Previa"){
                while (i< data.previa.grupos.length && !enc){
                    if (data.previa.grupos[i].groupName == req.params.grupo){
                        enc = true;
                        dataToSend = data.previa.grupos[i]
                    }
                    else
                        i++;
                }
            }
    
            else{
                while (i< data.rondas.length && !enc){
                    if (data.rondas[i].nombre == req.params.vuelta)
                        enc = true;

                    else
                        i++;
                }

                if (enc){
                    let j: number = 0;
                    while (j< data.rondas[i].grupos.length && !enc){
                        if (data.rondas[i].grupos[j].groupName == req.params.grupo){
                            enc = true;
                            dataToSend = data.rondas[i].grupos[j];
                        }
                        else
                            i++;
                    }
                }
            }

            if (enc)
                res.status(200).json(dataToSend);

            else
                res.status(409).json({message: "Vuelta no encontrada"});
        }

        else {
            return res.status(404).json({message: "Torneo not found"});
        }
    }, error => {
        return res.status(500).json({error}); 
    })
}

export default { getPartidosTorneo, getPartidosUser, addPartido, getPartidosGrupo, addResultados}
