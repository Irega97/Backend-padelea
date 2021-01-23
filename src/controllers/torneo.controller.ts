import { Request, Response } from "express";
import config from "../config/config";
import Torneo, { ITorneo } from "../models/torneo";
import User from "../models/user";
import Partido from "../models/partido";
const schedule = require('node-schedule');
import Chat from '../models/chat';

//Función que comprueba cada día a las 07:00:00h que torneos han empezado
schedule.scheduleJob('0 0 7 * * *', () => {
    checkStartTorneos();
    checkStartVueltas();
});

async function checkStartTorneos(){
    let torneoID: string;
    let groupName: string;
    let users = await User.find({}, {'torneos': 1}).populate('torneos');
    Torneo.find({"torneoIniciado":false}).then((data) => {
        if (data==null) console.log("Torneos not found");
        else {
            data.forEach(async (torneo) => {
                console.log("*******" + torneo.name + "*******");
                let previa = [];
                let cola: Array<any> = [];
                let j = 0;
                let nameGroups = config.letrasNombreGrupos;
                
                let tocaEmpezar = false;
                if(Date.parse(torneo.fechaInicio.toString()) <= Date.now()) tocaEmpezar = true;
                
                if(tocaEmpezar && torneo.players.length >= 4 && torneo.torneoIniciado != true){
                    let maxGroups = torneo.maxPlayers/4;
                    nameGroups.slice(0, maxGroups);
                    for(let i=0; i<torneo.players.length; i=i+4){
                        let jugadores = torneo.players.slice(i, i + 4)
                        if(jugadores.length % 4 == 0){ 
                            //Te los mete en el grupo
                            groupName = nameGroups[j];
                            j++;
                            let statisticsIniciales = {
                                partidosJugados: 0,
                                partidosGanados: 0,
                                partidosPerdidos: 0,
                                setsGanados: 0,
                                setsPerdidos: 0,
                                juegosGanados: 0,
                                juegosPerdidos: 0,
                                juegosDif: 0,
                                puntos: 0,
                                puntosExtra: 0
                            }
                            let grupo = {
                                groupName: groupName, 
                                classification: [{player: jugadores[0], statistics: statisticsIniciales},
                                                {player: jugadores[1], statistics: statisticsIniciales},
                                                {player: jugadores[2], statistics: statisticsIniciales}, 
                                                {player: jugadores[3], statistics: statisticsIniciales}],
                                partidos: []
                            }
                            previa.push(grupo); 
                            let message1: any = {
                                body : "Ha empezado la previa del torneo " + torneo.name,
                                date: new Date(Date.now()),
                                leidos: []
                            }

                            let message2: any = {
                                body : "Este es el chat del Grupo " + groupName,
                                date: new Date(Date.now()),
                                leidos: [] 
                            }

                            let chat = new Chat({
                                users: jugadores,
                                name: torneo.name + " Previa " + groupName,
                                admin: torneo.admin,
                                image: torneo.image,
                                mensajes: [message1, message2]
                            });
                        
                            let chatuser = {
                                chat: chat,
                                ultimoleido: 0
                            }

                            chat.save().then(datachat => {
                                jugadores.forEach(jugador => {
                                    User.findOneAndUpdate({"_id": jugador}, {$addToSet: {chats: chatuser}}).then(() => {
                                        const sockets = require('../sockets/socket').getVectorSockets();
                                        sockets.forEach((socket: any) =>{
                                            if (socket._id == jugador){
                                            socket.join(datachat._id);
                                            const io = require('../sockets/socket').getSocket();
                                            io.to(jugador).emit('nuevoChat', chatuser.chat);
                                        }
                                        })
                                    })
                                });
                            });
                        } else {
                            //te los mete en cola
                            for(let i = 0; i < jugadores.length; i++)
                                cola.push(jugadores[i]);
                        }
                    }
                    torneoID = torneo._id;
                    if(cola.length > 0) {
                        //ACTUALIZAR PLAYERS DEL TORNEO
                        torneo.players.forEach((player) => {
                            for(let i = 0; i < cola.length; i++){
                                if(player == cola[i]){
                                    torneo.players.splice(torneo.players.indexOf(cola[i], 1));
                                }
                            }
                        });
                        //ACTUALIZAR ESTADO TORNEO EN USER
                        users.forEach((user) => {
                            for(let i = 0; i < cola.length; i++){
                                if(cola[i].equals(user._id)){
                                    user.torneos.forEach((t) => {
                                        if(t.torneo.equals(torneoID)){
                                            t.status = 0;
                                            User.updateOne({"_id": user._id}, {$set: {torneos: user.torneos}}).then((data) => {
                                                if(data.nModified != 1) console.log("No actualizado");
                                            })
                                        }
                                    })
                                }
                            }
                        })
                    }
                    let duracion = torneo.duracionRondas;
                    let inicio = new Date(torneo.fechaInicio.toString());
                    inicio.setDate(inicio.getDate() + duracion);
                    let previaToSave: any = {
                        fechaFin: inicio,
                        grupos: previa
                    }
                    await Torneo.updateOne({name: torneo.name}, {$set: {players: torneo.players, previa: previaToSave}, $addToSet: {sobra: cola}}).then(async data => {
                        if(data.nModified != 1) console.log("No se ha modificado");
                        else{
                            await createPartidosPrevia(previaToSave, torneo._id, groupName);
                        } 
                    })
                } else if(torneo.players.length < 4 && tocaEmpezar){
                    console.log("Necesitas mínimo 4 jugadores para empezar el torneo");
                } else if(torneo.torneoIniciado == true){
                    console.log("Torneo ya iniciado");
                }   else {
                    console.log("El torneo no ha empezado aun");
                }
            });
        }
    }, (error) => {
        console.log(error);
        console.log("No se han podido comprobar los torneos");
    });
}

async function createPartidosPrevia(previa: any, torneoID: string, groupName: string){
    let torneo: ITorneo;
    let infoTorneo = {
        idTorneo: torneoID,
        vuelta: 'previa',
        grupo: groupName
    }
    await Torneo.findOne({"_id": torneoID}).then((data: any) => {
        torneo = data;
    });
    await previa.grupos.forEach(async (group: any) => {
        if(group.partidos.length != 0) console.log("Jaja");
        let players = group.classification;
        let partido1 = new Partido({
            torneo: infoTorneo,
            ganadores: [],
            jugadores: {
                pareja1: [players[0].player, players[1].player],
                pareja2: [players[2].player, players[3].player]
            }
        });
        let partido2 = new Partido({
            torneo: infoTorneo,
            ganadores: [],
            jugadores: {
                pareja1: [players[0].player, players[2].player],
                pareja2: [players[1].player, players[3].player]
            }
        });
        let partido3 = new Partido({
            torneo: infoTorneo,
            ganadores: [],
            jugadores: {
                pareja1: [players[0].player, players[3].player],
                pareja2: [players[2].player, players[1].player]
            }
        });
        await partido1.save().then((p) => {
            let p1ID = p._id;
            for(let i=0; i<players.length; i++){
                User.findOne({"_id": players[i].player}).then((user) => {
                    user?.partidos.push(p1ID);
                    User.updateOne({"_id": players[i].player}, {$set: {partidos: user?.partidos}}).then((d) => {
                        if(d.nModified != 1) return;
                    })
                })
            }
            group.partidos.push(p1ID);
        });
        await partido2.save().then((p) => {
            let p2ID = p._id;
            for(let i=0; i<players.length; i++){
                User.findOne({"_id": players[i].player}).then((user) => {
                    user?.partidos.push(p2ID);
                    User.updateOne({"_id": players[i].player}, {$set: {partidos: user?.partidos}}).then((d) => {
                        if(d.nModified != 1) return;
                    })
                })
            }
            group.partidos.push(p2ID);
        });
        await partido3.save().then((p) => {
            let p3ID = p._id;
            for(let i=0; i<players.length; i++){
                User.findOne({"_id": players[i].player}).then((user) => {
                    user?.partidos.push(p3ID);
                    User.updateOne({"_id": players[i].player}, {$set: {partidos: user?.partidos}}).then((d) => {
                        if(d.nModified != 1) return;
                    })
                })
            }
            group.partidos.push(p3ID);
        });

        await Torneo.updateOne({"_id": torneoID},{$set: {previa: previa, torneoIniciado: true}}).then((data) => {
            if(data.nModified != 1 && torneo != null){
                console.log("Torneo no actualizado");
                return;
            } else {
                console.log("Torneo iniciado correctamente!")
                let newNotification = {
                    type: "Torneo",
                    description: "El torneo " + torneo.name + " ha empezado!",
                    status: 1,
                    origen: torneo.name,
                    image: torneo.image
                }
                torneo.players.forEach((player) => {
                    User.updateOne({"_id": player._id},{$addToSet: {notifications: newNotification}}).then(data =>{
                        if (data.nModified == 1){
                            const io = require('../sockets/socket').getSocket()
                            io.to(player._id).emit('nuevaNotificacion', newNotification);
                        }
                        else{
                            return;
                        }
                    });
                });
            }
        });
    });
}

async function checkStartVueltas(){
    let torneoID: string;
    let groupame: string;
    let users = await User.find({}, {'torneos': 1}).populate('torneos');
    Torneo.find({"torneoIniciado":true}).then((data) => {
        data.forEach(torneo => {
            if (torneo.rondas.length == 0){
                if (Date.parse(torneo.previa.fechaFin.toString()) <= Date.now()){
                    //GrupoA1-> 1er G01, 2o G02, 1er G03, 2o G04
    
                    //GrupoA2-> 2do G01, 1er G02, 2do G03, 1ro G04 
    
                    //GrupoB1-> 3ro G01, 4to G02, 3ro G03, 4to G04
    
                    //GrupoB2-> 4to G01, 3o G02, 4to G03, 3ro G04
    
                    //Si hay 1 grupo igual, si hay 2 grupos 2o y 4to cambian, si hay 3 
                }
            }
            else{
                if (Date.parse(torneo.rondas[torneo.rondas.length - 1].fechaFin.toString()) <= Date.now()){
                    torneo.rondas[torneo.rondas.length - 1].grupos.forEach((grupo:any) => {

                    })
                }
            }
        })
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
    let duracionRondas = req.body.duracionRondas;
    let maxPlayers = req.body.maxPlayers;
    let participa = req.body.participa;
    let statisticsIniciales = {
        partidosJugados: 0,
        partidosGanados: 0,
        partidosPerdidos: 0,
        setsGanados: 0,
        setsPerdidos: 0,
        juegosGanados: 0,
        juegosPerdidos: 0,
        juegosDif: 0,
        puntos: 0,
        puntosExtra: 0
    };

    let torneo = new Torneo({
        name: name,
        type: type,
        description: description,
        image: image,
        fechaInicio: fechaInicio,
        partidosConfirmados: 0,
        torneoIniciado: false,
        finInscripcion: finInscripcion,
        ubicacion: ubicacion,
        reglamento: reglamento,
        numRondas: numRondas,
        duracionRondas: duracionRondas, 
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
            User.updateOne({"_id": req.user}, {$addToSet: {torneos : {torneo: data.id, statistics: statisticsIniciales, status: 1}}}).then(user => {
                if (user == null) return res.status(404).json({message: "User not found"});
            }, (error) =>{
                console.log(error);
                return res.status(500).json({message: "Internal Server Error"});
            });
        }
        const io = require('../sockets/socket').getSocket()
        io.emit('nuevoTorneo', torneo);
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
        let inscriptionsPeriod: boolean;
        let torneoLleno: boolean;
        let statisticsIniciales = {
            partidosJugados: 0,
            partidosGanados: 0,
            partidosPerdidos: 0,
            setsGanados: 0,
            setsPerdidos: 0,
            juegosGanados: 0,
            juegosPerdidos: 0,
            juegosDif: 0,
            puntos: 0,
            puntosExtra: 0
        };

        const io = require('../sockets/socket').getSocket()

        User.findById(req.user).then(async data => {
            if(t!=null){
                if(t.finInscripcion.valueOf()-Date.now() > 0){
                    inscriptionsPeriod = true;
                } else inscriptionsPeriod = false;
                
                if(t?.players.length < t?.maxPlayers) torneoLleno = false;
                else torneoLleno = true;
                
                if(!torneoLleno && inscriptionsPeriod && t.type != "private"){
                    Torneo.updateOne({"_id": t?._id},{$addToSet: {players: data?.id}}).then(torneo => {
                        console.log("torneo: ", torneo);
                        if(torneo.nModified != 1) return res.status(400).json({message: "Ya estás inscrito"});
                        else {
                            User.updateOne({"_id": data?._id},{$addToSet: {torneos: [{torneo: tID, statistics: statisticsIniciales, status: 1}]}}).then(user => {
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
                                User.updateOne({"_id": data?._id},{$addToSet: {torneos: [{torneo: tID, statistics: statisticsIniciales, status: 0}]}}).then(user => {
                                    if(user.nModified != 1) return res.status(400).json({message: "Ya has solicitado unirte"});
                                });
                            }
                            
                            if (t?.admin != undefined){
                                let newNotification = {
                                    type: "Cola",
                                    description: data?.username + " ha solicitado unirse al torneo " + t.name,
                                    status: 0,
                                    origen: data?.username,
                                    image: data?.image,
                                    otros: t.name
                                }

                                for (let i: number = 0; i < t?.admin.length; i++){
                                    User.updateOne({"_id": t.admin}, {$addToSet: {notifications: newNotification}}).then(data =>{
                                        if (data.nModified == 1){
                                            const io = require('../sockets/socket').getSocket();
                                            io.to(t?.admin).emit('nuevaNotificacion', newNotification);
                                        }
                                    });
                                }
                            }

                            if(!inscriptionsPeriod) return res.status(200).json({message: "Inscripciones cerradas. Has sido registrado en cola"});
                            else if(torneoLleno) return res.status(200).json({message: "El torneo está lleno. Has sido añadido a la cola"});
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
        } else if(t.fechaInicio - Date.now() < 0){
            return res.status(400).json({message: "No puedes abandonar el torneo porque ya ha empezado"});
        } else {
            return res.status(404).json({message: "No estás en el torneo"});
        }
    } catch (error){
        console.log(error);
        return res.status(500).json({message: "Internal Server Error"});
    }
}

async function getVueltas(req: Request, res: Response){
    let numVuelta: number = 0;
    Torneo.findOne({"name": req.params.name}, {previa: 1, rondas: 1}).populate({path: 'previa rondas', populate: {path: 'grupos', 
    populate: {path: 'classification', populate: {path: 'player', select: 'username image'}}}}).then((data) => {
        if(data != undefined){
            if(data.rondas.length > 0)
                numVuelta = data.rondas.length
            
            else if (data.previa.grupos.length == 0)
                numVuelta = -1;

            let dataToSend = {
                vueltas: data,
                vueltaActual: numVuelta
            }
            return res.status(200).json(dataToSend);
        } else {
            return res.status(404).json({message: "Torneo not found"});
        }
    })
}

export default { getTorneo, getTorneos, getTorneosUser, createTorneo, joinTorneo, leaveTorneo, checkStartTorneos, checkStartVueltas, getVueltas }
