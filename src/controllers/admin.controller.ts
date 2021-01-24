import { Request, Response } from "express";
import User from "../models/user";
import Torneo from "../models/torneo";
import torneoController from "./torneo.controller";
import notificationsController from "./notifications.controller";

async function getColaPlayers(req: Request, res: Response){
    try {
        Torneo.findOne({'name': req.params.name}, {cola: 1, players: 1, maxPlayers: 1, torneoIniciado: 1}).populate({path: 'cola', select: 'username name image'}).then((data) => {
            if(data==null) return res.status(404).json({message: "Cola not found"});
            let dataToSend = {
                cola: data.cola,
                length: data.players.length,
                max: data.maxPlayers,
                torneoIniciado: data.torneoIniciado
            }
            return res.status(200).json(dataToSend);
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
                                        io.to(userID).emit('aceptadoCola', req.params.name);
                                });
                            }
                            else {
                                message = "Usuario rechazado";
                                io.to(userID).emit('rechazadoCola', req.params.name);
                            }

                            d.admin.forEach(admin => {
                                notificationsController.deleteNotification("Cola", admin, user.username, req.params.name).then(data => {
                                    let info = {
                                        user: user.username,
                                        torneo: req.params.name
                                    }
                                    io.to(admin).emit('respondidoUsuarioCola', info);
                                })
                            })
                            
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

function empezarPrevia(req: Request, res: Response){
    let fechainicio = new Date(Date.now());
    let fechainscripcion = new Date(Date.now());
    fechainscripcion.setHours(fechainscripcion.getHours() - 2);
    fechainicio.setHours(fechainicio.getHours() - 1);
    Torneo.findOneAndUpdate({"name": req.params.name}, {$set: {finInscripcion: fechainscripcion, fechaInicio: fechainicio}}).then(data => {
        torneoController.checkStartTorneos();
        return res.status(200).json({message: "Previa creada con éxito"});
    })
}

function finalizarRonda(req: Request, res: Response){
    Torneo.findOne({"name": req.params.name}).then(data => {
        if (data?.rondas.length == 0){
            if (data.partidosConfirmados == data.previa.grupos.length*3){
                let fechafin = new Date(Date.now());
                data.previa.fechaFin = fechafin;
                Torneo.updateOne({"name": req.params.name}, {$set: {previa: data.previa}}).then(data => {
                    torneoController.checkStartVueltas();
                    return res.status(200).json({message: "Función en desarrollo"});
                })
            }  

            else
                return res.status(409).json({message: "No se han jugado todos los partidos aún"});
        }

        else{
            if (data?.partidosConfirmados == data?.rondas[data?.rondas.length - 1].grupos.length*3){
                let fechafin = new Date(Date.now());
                data.rondas[data.rondas.length - 1].fechaFin = fechafin;
                Torneo.updateOne({"name": req.params.name}, {$set: {rondas: data.rondas}}).then(data => {
                    return res.status(200).json({message: "Función en desarrollo"});
                })
            }  

            else
                return res.status(409).json({message: "No se han jugado todos los partidos aún"});
        }
    });
}

export default { getColaPlayers, acceptPlayers, empezarPrevia, finalizarRonda };