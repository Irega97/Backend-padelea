import { Request, Response } from "express";
import { isPartiallyEmittedExpression } from "typescript";
import Torneo from "../models/torneo";
import User from "../models/user";
const schedule = require('node-schedule');

//Función que comprueba cada día a las 07:00:00h que torneos han empezado
/* schedule.scheduleJob('* * * * * *', () => {
    checkStartTorneos();
}); */

async function checkStartTorneos(){
    Torneo.find({}).then((data) => {
        if (data==null) console.log("Torneos not found");
        else {
            data.forEach((torneo) => {
                if(torneo.name == 'test'){
                    let previa = [];
                    let cola = [];
                    let j = 0;
                    let numGroups = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
                    if(Date.parse(torneo.fechaInicio.toString()) <= Date.now() /* && torneo.players.length >= 4 */){
                        let maxGroups = torneo.maxPlayers/4;
                        numGroups.splice(0, maxGroups);
                        console.log("Jugadores: ", torneo.players);
                        for(let i=0; i<torneo.players.length; i=i+4){
                            let jugadores = torneo.players.slice(i, i + 4)
                            console.log("players: ", jugadores);
                            if(jugadores.length % 4 == 0){ 
                                //Te los mete en el grupo
                                let groupName = numGroups[j];
                                let grupo = {
                                    groupName: groupName, 
                                    classification: [jugadores[0], jugadores[1], jugadores[2], jugadores[3]]
                                }
                                previa.push(grupo); 
                                j++;
                                console.log(previa);
                            } else {
                                //te los mete en cola
                                cola.push(jugadores);
                                console.log("cola: ", cola);
                            }
                        }
                    } /* else if(torneo.players.length < 4){
                        console.log("Necesitas mínimo 4 jugadores para empezar el torneo");
                    } */ else {
                        console.log("El torneo no ha empezado aun");
                    }
                }
            });
        }
    }, (error) => {
        console.log("No se han podido comprobar los torneos");
        return;
    });
}

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

async function getTorneosUser(req: Request, res: Response){
    User.findOne({"username": req.params.username}, 'torneos').populate({path: 'torneos', populate: {path: 'torneo', select: 'name image'}}).then((data) => {
        if (data==null) return res.status(404).json({message: 'Torneos not found'});
        data.torneos.forEach((torneo) => {
            if(torneo.status == 0)
                data.torneos.splice(data.torneos.indexOf(torneo), 1);
        })
        return res.status(200).json(data);
    }, (error) => {
        return res.status(500).json(error);
    });
}

async function createTorneo(req: Request, res: Response){
    let name = req.body.name;

    let checkName = await Torneo.findOne({"name": name});
    if(checkName) return res.status(409).json("Este torneo ya existe");

    let user = req.user;
    let type = req.body.type;
    let description = req.body.description;
    let image = 'https://res.cloudinary.com/dyjz5e9a6/image/upload/v1609083619/default%20images/la-red-en-el-padel_wyfchm.jpg'
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
        image: image,
        fechaInicio: fechaInicio,
        finInscripcion: finInscripcion,
        ubicacion: ubicacion,
        reglamento: reglamento,
        numRondas: numRondas,
        admin: [user],
        maxPlayers: maxPlayers,
        finalizado: false,
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
        const io = require('../sockets/socket').getSocket()
        io.emit('nuevoTorneo', torneo.name);
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

        const io = require('../sockets/socket').getSocket()

        User.findById(req.user).then(async data => {
            if(t!=null){
                if(t.finInscripcion.valueOf()-Date.now() > 0){
                    inscriptionsPeriod = true;
                } else inscriptionsPeriod = false;
                if(t?.players.length < t?.maxPlayers && inscriptionsPeriod && t.type != "private"){
                    Torneo.updateOne({"_id": t?._id},{$addToSet: {players: data?.id}}).then(torneo => {
                        console.log("torneo: ", torneo);
                        if(torneo.nModified != 1) return res.status(400).json({message: "Ya estás inscrito"});
                        else {
                            User.updateOne({"_id": data?._id},{$addToSet: {torneos: [{torneo: tID, statistics: null, status: 1}]}}).then(user => {
                                if(user.nModified != 1) return res.status(400).json({message: "Ya estás inscrito"});
                                let playerToSend = {
                                    torneo: req.params.name,
                                    username: data?.username,
                                    name: data?.name,
                                    image: data?.image
                                }
                                io.emit('nuevoJugador', playerToSend);
                                return res.status(200).json({message: "Te has unido a " + t?.name});
                            });
                        }
                    });
                } else {
                    let isPlayer = false
                    t.players.forEach((player) => {
                        if(player == req.user)
                            isPlayer = true;
                    });
                    if(isPlayer) return res.status(400).json({message: "Ya estás inscrito"})
                    else {
                        Torneo.updateOne({"_id": t?._id},{$addToSet: {cola: data?.id}}).then(torneo => {
                            if(torneo.nModified != 1) return res.status(400).json({message: "Ya has solicitado unirte"});
                            else {
                                User.updateOne({"_id": data?._id},{$addToSet: {torneos: [{torneo: tID, statistics: null, status: 0}]}}).then(user => {
                                    if(user.nModified != 1) return res.status(400).json({message: "Ya has solicitado unirte"});
                                });
                            }
                            return res.status(200).json({message: "Has solicitado unirte a " + t?.name});
                        });                        
                    }
                }
            }
            else return res.status(404).json({message: "Torneo not found"});
        });
    } catch(error){
        console.log(error);
        return res.status(500).json({message: "Internal Server Error"});
    }
}

async function leaveTorneo(req: Request, res: Response){
    //TE DEJA IRTE SI ESTAS EN COLA O SI AUN NO HA EMPEZADO
    try {
        let t: any;
        let u: any;
        let status: number = -1;

        const io = require('../sockets/socket').getSocket()
        
        await Torneo.findOne({"name": req.params.name}).then((data) => {
            if(data == null) return res.status(404).json({message: "Torneo not found"});
            else {
                t = data;
            }
        });
        
        await User.findById(req.user).then((data) => {
            if(data == null) return res.status(404).json({message: "User not found"});
            else{
                data?.torneos.forEach((torneo) => {
                    if(torneo.torneo.toString() == t?._id)
                        status = torneo.status;
                });
                u = data;
            }
        });

        if(status == 0){ //COLA
            t?.cola.forEach((user: any) => {
                if(user == req.user)
                    t?.cola.splice(t?.cola.indexOf(user), 1);
            });
            Torneo.updateOne({name: t?.name}, {$set: {cola: t?.cola}}).then((data) => {
                if(data.nModified != 1) return res.status(400).json({message: "No has podido abandonar " + t.name})
                u.torneos.forEach((torneo: any) => {
                    if(torneo.torneo == t?.id){
                        u.torneos.splice(u.torneos.indexOf(torneo), 1);
                    }
                });
                User.updateOne({"_id": req.user}, {$set: {torneos: u.torneos}}).then((data)=> {
                    if(data.nModified != 1) return res.status(400).json({message: "No has podido abandonar "+t.name});
                    else return res.status(200).json({message: "Has abandonado " + t?.name});
                }); 
            });
        } else if (status == 1 && t.fechaInicio - Date.now() > 0){ //PLAYER
            t?.players.forEach((user: any) => {
                if(user == req.user)
                    t?.players.splice(t?.players.indexOf(user), 1);
            });
            Torneo.updateOne({name: t?.name}, {$set: {players: t?.players}}).then((data) => {
                if(data.nModified != 1) return res.status(400).json({message: "No has podido abandonar " + t.name})
                u.torneos.forEach((torneo: any) => {
                    if(torneo.torneo == t?.id){
                        u.torneos.splice(u.torneos.indexOf(torneo), 1);
                    }
                });
                User.updateOne({"_id": req.user}, {$set: {torneos: u.torneos}}).then((data)=> {
                    if(data.nModified != 1) return res.status(400).json({message: "No has podido abandonar "+t.name});
                    else {
                        let jugador = {
                            username: u.username,
                            torneo: t.name
                        }
                        io.emit('player-left', jugador);
                        return res.status(200).json({message: "Has abandonado " + t?.name});
                    }
                }); 
            });
        } else {
            return res.status(400).json({message: "No estás en el torneo"});
        }
    } catch (error){
        console.log(error);
        return res.status(500).json({message: "Internal Server Error"});
    }
}

export default { getTorneo, getTorneos, getTorneosUser, createTorneo, joinTorneo, leaveTorneo, checkStartTorneos }
