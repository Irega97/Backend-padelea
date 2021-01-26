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
                let participanteschat: Array<any> = [];
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
                                puntos: 0
                            }
                            let grupo = {
                                groupName: groupName, 
                                classification: [{player: jugadores[0], statistics: statisticsIniciales},
                                                {player: jugadores[1], statistics: statisticsIniciales},
                                                {player: jugadores[2], statistics: statisticsIniciales}, 
                                                {player: jugadores[3], statistics: statisticsIniciales}],
                                partidos: [],
                                chat: ''
                            }
                            
                            let message1: any = {
                                body : "Ha empezado la Previa del torneo " + torneo.name,
                                date: new Date(Date.now()),
                                leidos: []
                            }

                            let message2: any = {
                                body : "Este es el chat del Grupo " + groupName,
                                date: new Date(Date.now()),
                                leidos: [] 
                            }

                            participanteschat = jugadores;
                            torneo.admin.forEach(admin => {
                                let a: number = 0;
                                let encchat: boolean = false;
                                while (a < participanteschat.length && !encchat){
                                    if (participanteschat[a].toString() == admin.toString())
                                        encchat = true;
                                    
                                    else
                                        a++;
                                }

                                if (!encchat)
                                    participanteschat.push(admin);
                            });

                            let chat = new Chat({
                                users: participanteschat,
                                name: torneo.name + " Previa " + groupName,
                                admin: torneo.admin,
                                image: torneo.image,
                                mensajes: [message1, message2]
                            });
                        
                            let chatuser = {
                                chat: chat,
                                ultimoleido: 0
                            }

                            await chat.save().then(datachat => {
                                grupo.chat = datachat._id;
                                chatuser.chat = datachat;
                                participanteschat.forEach(participante => {
                                    User.findOneAndUpdate({"_id": participante}, {$addToSet: {chats: chatuser}}).then(() => {
                                        const sockets = require('../sockets/socket').getVectorSockets();
                                        sockets.forEach((socket: any) =>{
                                            if (socket._id == participante){
                                                socket.join(datachat._id);
                                                const io = require('../sockets/socket').getSocket();
                                                io.to(participante).emit('nuevoChatGrupo', chatuser.chat);
                                            }
                                        })
                                    })
                                });
                            });
                            previa.push(grupo); 
                            participanteschat = [];
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
                            Torneo.findOne({name: torneo.name}, {rondas: 1}).populate({path: 'previa', populate: {path: 'grupos', 
                                populate: {path: 'classification', populate: {path: 'player', select: 'username image'}}}}).then(dataVuelta => {
                                    const io = require('../sockets/socket').getSocket();
                                    let info = {
                                        torneo: dataVuelta?._id,
                                        vuelta: dataVuelta?.previa
                                    }
                                    io.emit('nuevaVuelta', info);
                                })
                            previaToSave.name = 'previa';
                            await createPartidos(previaToSave, torneo._id);
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

async function createPartidos(ronda: any, torneoID: string){
    //PARAM RONDA: fechaFin, name, grupos
    let torneo: ITorneo;
    let infoTorneo = {
        idTorneo: torneoID,
        vuelta: ronda.name,
        grupo: ''
    }
    await Torneo.findOne({"_id": torneoID}).then((data: any) => {
        torneo = data;
    });
    await ronda.grupos.forEach(async (group: any) => {
        let players = group.classification;
        infoTorneo.grupo = group.groupName;
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

        if(ronda.name.toString() == 'previa'){
            await Torneo.updateOne({"_id": torneoID},{$set: {previa: ronda, torneoIniciado: true}}).then((data) => {
                if(data.nModified != 1 && torneo != null){
                    console.log("Torneo no actualizado");
                    return;
                } else {
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
        } else {
            torneo.rondas[torneo.rondas.length - 1] = ronda;
            await Torneo.updateOne({"_id": torneoID},{$set: {rondas: torneo.rondas}}).then((data) => {
                if(data.nModified != 1 && torneo != null){
                    console.log("Torneo no actualizado");
                    return;
                } else {
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
        }
    });
}

async function checkStartVueltas(){
    let torneoID: string;
    Torneo.find({"torneoIniciado":true, "finalizado":false}).then(data => {
        data.forEach(async torneo => {
            if (torneo.rondas.length == 0){
                if (Date.parse(torneo.previa.fechaFin.toString()) <= Date.now()){
                    torneoID = torneo._id;
                    let statisticsIniciales = {
                        partidosJugados: 0,
                        partidosGanados: 0,
                        partidosPerdidos: 0,
                        setsGanados: 0,
                        setsPerdidos: 0,
                        juegosGanados: 0,
                        juegosPerdidos: 0,
                        juegosDif: 0,
                        puntos: 0
                    }

                    let nameGroups = config.letrasNombreVueltas;
                    let grupos: any = [];
                    let classification: any = [];
                    let participanteschat: Array<any> = [];
                    let ronda = {
                        name: "Vuelta 1",
                        fechaFin: new Date(Date.now()),
                        grupos: grupos
                    };

                    ronda.fechaFin.setDate(ronda.fechaFin.getDate() + torneo.duracionRondas);
                    let i: number = 0;
                    while (i < torneo.previa.grupos.length){
                        let grupo = {
                            groupName: nameGroups[i],
                            classification: classification,
                            partidos: [],
                            chat: ''
                        }
                        if (i + 1 < torneo.previa.grupos.length){
                            if (i == 0){
                                grupo.classification = [{player: torneo.previa.grupos[i].classification[0].player, statistics: statisticsIniciales},
                                                        {player: torneo.previa.grupos[i].classification[1].player, statistics: statisticsIniciales},
                                                        {player: torneo.previa.grupos[i + 1].classification[0].player, statistics: statisticsIniciales}, 
                                                        {player: torneo.previa.grupos[i + 1].classification[1].player, statistics: statisticsIniciales}]
                            }

                            else{
                                grupo.classification = [{player: torneo.previa.grupos[i - 1].classification[2].player, statistics: statisticsIniciales},
                                                        {player: torneo.previa.grupos[i - 1].classification[3].player, statistics: statisticsIniciales},
                                                        {player: torneo.previa.grupos[i + 1].classification[0].player, statistics: statisticsIniciales}, 
                                                        {player: torneo.previa.grupos[i + 1].classification[1].player, statistics: statisticsIniciales}]
                            }
                        }
                        else{
                            if (i == 0){
                                grupo.classification = [{player: torneo.previa.grupos[i].classification[0].player, statistics: statisticsIniciales},
                                                        {player: torneo.previa.grupos[i].classification[1].player, statistics: statisticsIniciales},
                                                        {player: torneo.previa.grupos[i].classification[2].player, statistics: statisticsIniciales}, 
                                                        {player: torneo.previa.grupos[i].classification[3].player, statistics: statisticsIniciales}]
                            }
                            else{
                                grupo.classification = [{player: torneo.previa.grupos[i - 1].classification[2].player, statistics: statisticsIniciales},
                                                        {player: torneo.previa.grupos[i - 1].classification[3].player, statistics: statisticsIniciales},
                                                        {player: torneo.previa.grupos[i].classification[2].player, statistics: statisticsIniciales}, 
                                                        {player: torneo.previa.grupos[i].classification[3].player, statistics: statisticsIniciales}]
                            }
                        }

                        participanteschat.push(grupo.classification[0].player);
                        participanteschat.push(grupo.classification[1].player);
                        participanteschat.push(grupo.classification[2].player);
                        participanteschat.push(grupo.classification[3].player);

                        torneo.admin.forEach(admin => {
                            let a: number = 0;
                            let encchat: boolean = false;
                            while (a < participanteschat.length && !encchat){
                                if (participanteschat[a].toString() == admin.toString())
                                    encchat = true;
                                
                                else
                                    a++;
                            }
                            if (!encchat)
                                participanteschat.push(admin);
                        });

                        let message1: any = {
                            body : "Ha empezado la Vuelta 1 del torneo " + torneo.name,
                            date: new Date(Date.now()),
                            leidos: []
                        }

                        let message2: any = {
                            body : "Este es el chat del Grupo " + grupo.groupName,
                            date: new Date(Date.now()),
                            leidos: [] 
                        }
                        let chat = new Chat({
                            users: participanteschat,
                            name: torneo.name + " Vuelta 1 " + grupo.groupName,
                            admin: torneo.admin,
                            image: torneo.image,
                            mensajes: [message1, message2]
                        });
                    
                        let chatuser = {
                            chat: chat,
                            ultimoleido: 0
                        }

                        await chat.save().then(datachat => {
                            grupo.chat = datachat._id;
                            chatuser.chat = datachat;
                            participanteschat.forEach(participante => {
                                User.findOneAndUpdate({"_id": participante}, {$addToSet: {chats: chatuser}}).then(() => {
                                    const sockets = require('../sockets/socket').getVectorSockets();
                                    sockets.forEach((socket: any) =>{
                                        if (socket._id == participante){
                                            socket.join(datachat._id);
                                            const io = require('../sockets/socket').getSocket();
                                            io.to(participante).emit('nuevoChatGrupo', chatuser.chat);
                                        }
                                    })
                                })
                            });
                        });

                        ronda.grupos.push(grupo);
                        participanteschat = [];
                        i++;
                    }

                    torneo.previa.grupos.forEach(async (grupo:any) => {
                        await Chat.deleteOne({"_id": grupo.chat}).then(() => {
                            grupo.classification.forEach(async (clasi:any) => {
                                await User.findOne({"_id":clasi.player}, {chats: 1}).then(async (user:any) => {
                                    let enc: Boolean = false;
                                    let i: number = 0;
                                    if (user != undefined){
                                        while (i<user?.chats.length && !enc){
                                            if (user.chats[i].chat.toString() == grupo.chat.toString())
                                                enc = true;

                                            else
                                                i++;
                                        }

                                        if (enc) {
                                            user.chats.splice(i, 1);
                                            await User.updateOne({"_id":user._id}, {$set: {chats: user.chats}}).then(() => {
                                                const io = require('../sockets/socket').getSocket();
                                                io.to(user._id).emit('borrarChat', grupo.chat);
                                            });
                                        }   
                                    }
                                })
                            })
                        })
                    })

                    await Torneo.updateOne({name: torneo.name}, {$addToSet: {rondas: ronda}, $set: {partidosConfirmados: 0}}).then(async data => {
                        if(data.nModified != 1) console.log("No se ha modificado");
                        else{
                            Torneo.findOne({name: torneo.name}, {rondas: 1}).populate({path: 'rondas', populate: {path: 'grupos', 
                                populate: {path: 'classification', populate: {path: 'player', select: 'username image'}}}}).then(dataVuelta => {
                                    const io = require('../sockets/socket').getSocket();
                                    let info = {
                                        torneo: dataVuelta?._id,
                                        vuelta: dataVuelta?.rondas[dataVuelta.rondas.length - 1]
                                    }
                                    io.emit('nuevaVuelta', info);
                                })
                            await createPartidos(ronda, torneoID);
                        } 
                    })
                }
            }
            else{
                if (Date.parse(torneo.rondas[torneo.rondas.length - 1].fechaFin.toString()) <= Date.now()){
                    if (torneo.rondas.length  == torneo.numRondas){
                        torneoID = torneo._id;
                        let statisticsIniciales = {
                            partidosJugados: 0,
                            partidosGanados: 0,
                            partidosPerdidos: 0,
                            setsGanados: 0,
                            setsPerdidos: 0,
                            juegosGanados: 0,
                            juegosPerdidos: 0,
                            juegosDif: 0,
                            puntos: 0
                        }

                        let numGrupo: number = 0;
                        let puntosExtra: number[] = [];
                        
                        let i: number = 0;
                        while (i < torneo.rondas[torneo.rondas.length - 1].grupos.length){
                            let grupo = {
                                classification: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification,
                                partidos: torneo.rondas[torneo.rondas.length - 1].grupos[i].partidos
                            }

                            if(i == 0){
                                grupo.classification = [{player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[0].player, statistics: statisticsIniciales}];
                                puntosExtra.push(59);
                                grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[1].player, statistics: statisticsIniciales});
                                puntosExtra.push(57);
                                grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[2].player, statistics: statisticsIniciales});
                                puntosExtra.push(56);
                                grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[3].player, statistics: statisticsIniciales});
                                puntosExtra.push(55); 
                            }

                            else if (i == 1){
                                grupo.classification = [{player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[0].player, statistics: statisticsIniciales}];
                                puntosExtra.push(58);
                                grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[1].player, statistics: statisticsIniciales});
                                puntosExtra.push(57);
                                grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[2].player, statistics: statisticsIniciales});
                                puntosExtra.push(56);
                                grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[3].player, statistics: statisticsIniciales});
                                puntosExtra.push(55); 
                            }

                            else{
                                let aux = i/2;
                                if(aux % 1 == 0){
                                    numGrupo = aux - 1;
                                } else numGrupo = aux - 1.5;
                                
                                grupo.classification = [{player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[0].player, statistics: statisticsIniciales}];
                                puntosExtra.push(58 - 11*numGrupo);
                                grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[1].player, statistics: statisticsIniciales});
                                puntosExtra.push(57 - 11*numGrupo);
                                grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[2].player, statistics: statisticsIniciales});
                                puntosExtra.push(56 - 11*numGrupo);
                                grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[3].player, statistics: statisticsIniciales});
                                puntosExtra.push(55 - 11*numGrupo);
                            }
                            grupo.classification.forEach(async (clasi:any) => {
                                await User.findOne({"_id": clasi.player}, {torneo: 1}).populate('torneos').then(data => {
                                    data?.torneos.forEach(async torneo => {
                                        if (torneo.torneo.toString() == torneoID.toString()){
                                            torneo.statistics.puntosExtra = torneo.statistics.puntosExtra + puntosExtra[0];
                                            puntosExtra.splice(0, 1);
                                            torneo.status = 2;
                                            await User.updateOne({"_id": clasi.player}, {$set: {torneos: data?.torneos}});
                                        }
                                    })
                                })
                            })
                            i++;
                        }
                        
                        torneo.rondas[torneo.rondas.length - 1].grupos.forEach(async (grupo:any) => {
                            await Chat.deleteOne({"_id": grupo.chat}).then(() => {
                                grupo.classification.forEach(async (clasi:any) => {
                                    await User.findOne({"_id":clasi.player}, {chats: 1}).then(async (user:any) => {
                                        let enc: Boolean = false;
                                        let i: number = 0;
                                        if (user != undefined){
                                            while (i<user?.chats.length && !enc){
                                                if (user.chats[i].chat.toString() == grupo.chat.toString())
                                                    enc = true;

                                                else
                                                    i++;
                                            }

                                            if (enc) {
                                                user.chats.splice(i, 1);
                                                await User.updateOne({"_id":user._id}, {$set: {chats: user.chats}}).then(() => {
                                                    const io = require('../sockets/socket').getSocket();
                                                    io.to(user._id).emit('borrarChat', grupo.chat);
                                                });
                                            }   
                                        }
                                    })
                                })
                            })
                        })

                        getGanador(torneo.name).then(async data => {
                            await Torneo.updateOne({name: torneo.name}, {$set: {finalizado: true, ganador: data}}).then(data => {
                                if(data.nModified != 1) console.log("No se ha modificado");
                            }); 
                        });                      
                    }

                    else{
                        torneoID = torneo._id;
                        let statisticsIniciales = {
                            partidosJugados: 0,
                            partidosGanados: 0,
                            partidosPerdidos: 0,
                            setsGanados: 0,
                            setsPerdidos: 0,
                            juegosGanados: 0,
                            juegosPerdidos: 0,
                            juegosDif: 0,
                            puntos: 0
                        }

                        let nameGroups = config.letrasNombreVueltas;
                        let grupos: any = [];
                        let numGrupo: number = 0;
                        let puntosExtra: number[] = [];
                        let classification: any = [];
                        let participanteschat: Array<any> = [];
                        let ronda = {
                            name: "Vuelta " + (torneo.rondas.length + 1),
                            fechaFin: new Date(Date.now()),
                            grupos: grupos
                        };

                        ronda.fechaFin.setDate(ronda.fechaFin.getDate() + torneo.duracionRondas);
                        let i: number = 0;
                        while (i < torneo.rondas[torneo.rondas.length - 1].grupos.length){
                            let grupo = {
                                groupName: nameGroups[i],
                                classification: classification,
                                partidos: [],
                                chat: ''
                            }
                            if(i == 0){
                                grupo.classification = [{player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[0].player, statistics: statisticsIniciales}];
                                puntosExtra.push(59);

                                if (torneo.rondas[torneo.rondas.length - 1].grupos.length > 1){
                                    grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i + 1].classification[0].player, statistics: statisticsIniciales});
                                    puntosExtra.push(58);
                                    grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i + 1].classification[2].player, statistics: statisticsIniciales});
                                    puntosExtra.push(56);

                                    if (torneo.rondas[torneo.rondas.length - 1].grupos.length > 3){
                                        grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i + 3].classification[0].player, statistics: statisticsIniciales});
                                        puntosExtra.push(55);
                                    } 
                           
                                    else{
                                        grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[3].player, statistics: statisticsIniciales});
                                        puntosExtra.push(55);
                                    }
                                        
                                }
                                else{
                                    grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[1].player, statistics: statisticsIniciales});
                                    puntosExtra.push(57);
                                    grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[2].player, statistics: statisticsIniciales});
                                    puntosExtra.push(56);
                                    grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[3].player, statistics: statisticsIniciales});
                                    puntosExtra.push(55);
                                }
                            }

                            else if (i == 1){
                                grupo.classification = [{player: torneo.rondas[torneo.rondas.length - 1].grupos[i - 1].classification[1].player, statistics: statisticsIniciales}]; 
                                puntosExtra.push(57);
                                grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[1].player, statistics: statisticsIniciales}); 
                                puntosExtra.push(57);
                                grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i - 1].classification[2].player, statistics: statisticsIniciales}); 
                                puntosExtra.push(56);

                                if (torneo.rondas[torneo.rondas.length - 1].grupos.length > 2){
                                    grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i + 1].classification[0].player, statistics: statisticsIniciales}); 
                                    puntosExtra.push(55);
                                }

                                else{
                                    grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[3].player, statistics: statisticsIniciales}); 
                                    puntosExtra.push(55);
                                }
                            }

                            else{
                                // grupos:[ B1 B2 C1 C2 D1 D2]
                                // i     :[ 2  3  4  5  6  7]
                                // aux   :[ 1 1.5 2 2.5 3 3.5]
                                // numgru:[ 1  1  2  2  3  3]
                                let aux = i/2;
                                if(aux % 1 == 0){
                                    numGrupo = aux - 1;
                                } else numGrupo = aux - 1.5;
                                if (i % 2 != 0){
                                    grupo.classification = [{player: torneo.rondas[torneo.rondas.length - 1].grupos[i - 3].classification[3].player, statistics: statisticsIniciales}];
                                    puntosExtra.push(55 - 11*numGrupo);
                                    grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[1].player, statistics: statisticsIniciales});
                                    puntosExtra.push(46 - 11*numGrupo);
                                    grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i - 1].classification[2].player, statistics: statisticsIniciales});
                                    puntosExtra.push(45 - 11*numGrupo);

                                    if (i + 1 < torneo.rondas[torneo.rondas.length - 1].grupos.length){
                                        grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i + 1].classification[0].player, statistics: statisticsIniciales});
                                        puntosExtra.push(44 - 11*numGrupo);
                                    }

                                    else{
                                        grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[3].player, statistics: statisticsIniciales});
                                        puntosExtra.push(44 - 11*numGrupo);
                                    }
                                }

                                else{
                                    grupo.classification = [{player: torneo.rondas[torneo.rondas.length - 1].grupos[i - 1].classification[3].player, statistics: statisticsIniciales}];
                                    puntosExtra.push(55 - 11*numGrupo);
                                    grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[1].player, statistics: statisticsIniciales});
                                    puntosExtra.push(46 - 11*numGrupo);

                                    if (i + 1 < torneo.rondas[torneo.rondas.length - 1].grupos.length){
                                        grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i + 1].classification[2].player, statistics: statisticsIniciales});
                                        puntosExtra.push(45 - 11*numGrupo);

                                        if (i + 3 < torneo.rondas[torneo.rondas.length - 1].grupos.length){
                                            grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i + 3].classification[0].player, statistics: statisticsIniciales});
                                            puntosExtra.push(44 - 11*numGrupo);
                                        }

                                        else{
                                            grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[3].player, statistics: statisticsIniciales});
                                            puntosExtra.push(44 - 11*numGrupo);
                                        }
                                    }
                                    else{
                                        grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[2].player, statistics: statisticsIniciales});
                                        puntosExtra.push(45 - 11*numGrupo);
                                        grupo.classification.push({player: torneo.rondas[torneo.rondas.length - 1].grupos[i].classification[3].player, statistics: statisticsIniciales});
                                        puntosExtra.push(44 - 11*numGrupo);
                                    }
                                }
                            }

                            participanteschat.push(grupo.classification[0].player);
                            participanteschat.push(grupo.classification[1].player);
                            participanteschat.push(grupo.classification[2].player);
                            participanteschat.push(grupo.classification[3].player);

                            torneo.admin.forEach(admin => {
                                let a: number = 0;
                                let encchat: boolean = false;
                                while (a < participanteschat.length && !encchat){
                                    if (participanteschat[a].toString() == admin.toString())
                                        encchat = true;
                                    
                                    else
                                        a++;
                                }
                                if (!encchat)
                                    participanteschat.push(admin);
                            });

                            let message1: any = {
                                body : "Ha empezado la " + ronda.name + " del " + torneo.name,
                                date: new Date(Date.now()),
                                leidos: []
                            }

                            let message2: any = {
                                body : "Este es el chat del Grupo " + grupo.groupName,
                                date: new Date(Date.now()),
                                leidos: [] 
                            }

                            let chat = new Chat({
                                users: participanteschat,
                                name: torneo.name + " " + ronda.name + " " + grupo.groupName,
                                admin: torneo.admin,
                                image: torneo.image,
                                mensajes: [message1, message2]
                            });
                        
                            let chatuser = {
                                chat: chat,
                                ultimoleido: 0
                            }

                            await chat.save().then(datachat => {
                                grupo.chat = datachat._id;
                                chatuser.chat = datachat;
                                participanteschat.forEach(participante => {
                                    User.findOneAndUpdate({"_id": participante}, {$addToSet: {chats: chatuser}}).then(() => {
                                        const sockets = require('../sockets/socket').getVectorSockets();
                                        sockets.forEach((socket: any) =>{
                                            if (socket._id == participante){
                                                socket.join(datachat._id);
                                                const io = require('../sockets/socket').getSocket();
                                                io.to(participante).emit('nuevoChatGrupo', chatuser.chat);
                                            }
                                        })
                                    })
                                });
                            });

                            grupo.classification.forEach(async (clasi:any) => {
                                await User.findOne({"_id": clasi.player}, {torneo: 1}).populate('torneos').then(data => {
                                    data?.torneos.forEach(async torneo => {
                                        if (torneo.torneo.toString() == torneoID.toString()){
                                            torneo.statistics.puntosExtra = torneo.statistics.puntosExtra + puntosExtra[0];
                                            puntosExtra.splice(0, 1);
                                            await User.updateOne({"_id": clasi.player}, {$set: {torneos: data?.torneos}});
                                        }
                                    })
                                })
                            })

                            ronda.grupos.push(grupo);
                            participanteschat = [];
                            i++;
                        }

                        await Torneo.updateOne({name: torneo.name}, {$addToSet: {rondas: ronda}, $set: {partidosConfirmados: 0}}).then(async data => {
                            if(data.nModified != 1) console.log("No se ha modificado");
                            else{
                                Torneo.findOne({name: torneo.name}, {rondas: 1}).populate({path: 'rondas', populate: {path: 'grupos', 
                                populate: {path: 'classification', populate: {path: 'player', select: 'username image'}}}}).then(dataVuelta => {
                                    const io = require('../sockets/socket').getSocket();
                                    let info = {
                                        torneo: dataVuelta?._id,
                                        vuelta: dataVuelta?.rondas[dataVuelta.rondas.length - 1]
                                    }
                                    io.emit('nuevaVuelta', info);
                                })
                                await createPartidos(ronda, torneoID);
                                torneo.rondas[torneo.rondas.length - 1].grupos.forEach(async (grupo:any) => {
                                    await Chat.deleteOne({"_id": grupo.chat}).then(() => {
                                        grupo.classification.forEach(async (clasi:any) => {
                                            await User.findOne({"_id":clasi.player}, {chats: 1}).then(async (user:any) => {
                                                let enc: Boolean = false;
                                                let i: number = 0;
                                                if (user != undefined){
                                                    while (i<user?.chats.length && !enc){
                                                        if (user.chats[i].chat.toString() == grupo.chat.toString())
                                                            enc = true;
        
                                                        else
                                                            i++;
                                                    }
        
                                                    if (enc) {
                                                        user.chats.splice(i, 1);
                                                        await User.updateOne({"_id":user._id}, {$set: {chats: user.chats}}).then(() => {
                                                            const io = require('../sockets/socket').getSocket();
                                                            io.to(user._id).emit('borrarChat', grupo.chat);
                                                        });
                                                    }   
                                                }
                                            })
                                        })
                                    })
                                })
                            } 
                        })
                    }
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
        ganador: null,
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
        const io = require('../sockets/socket').getSocket();
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

async function getRanking(req: Request, res: Response){
    const torneoName = req.params.name;
    let ranking: Array<any> = [];
    console.log("name ", torneoName);
    Torneo.findOne({"name": torneoName},{players: 1}).populate({path:'players', select: 'torneos username image'}).then((data) => {
        if(data == null) return res.status(404).json({message: "Torneo not found"});
        console.log("aqui: ", data);
        data.players.forEach((player: any) => {
            player.torneos.forEach((torneo: any) => {
                if(torneo.torneo.toString() == data._id.toString()){
                    ranking.push({player: player, statistics: torneo.statistics});
                }
            })
        });

        ranking.sort((a: any,b: any) => {
            if(a.statistics.puntosExtra != undefined && b.statistics.puntosExtra != undefined){
                if ((a.statistics.puntosExtra > b.statistics.puntosExtra) && (a.statist))
                return -1;

                else if (a.statistics.puntosExtra < b.statistics.puntosExtra)
                    return 1;

                else{
                    if (a.statistics.puntos > b.statistics.puntos)
                        return -1;

                    else if (a.statistics.puntos < b.statistics.puntos)
                        return 1;
                    
                    else {
                        if (a.statistics.juegosDif > b.statistics.juegosDif)
                            return -1;

                        else return 1;
                    }
                }
            } else {
                if (a.statistics.puntos > b.statistics.puntos)
                        return -1;

                    else if (a.statistics.puntos < b.statistics.puntos)
                        return 1;
                    
                    else {
                        if (a.statistics.juegosDif > b.statistics.juegosDif)
                            return -1;

                        else return 1;
                    }
            }
            
        })

        return res.status(200).json({isImage: true, ranking: ranking});

    });
}

async function getGanador(torneoName: string) : Promise<any>{
    const torneo = torneoName;
    let ranking: Array<any> = [];
    return new Promise(function (resolve) {
        Torneo.findOne({"name": torneo},{players: 1}).populate({path:'players', select: 'torneos username image'}).then((data) => {
            if(data == null) return [];
            data.players.forEach((player: any) => {
                player.torneos.forEach((torneo: any) => {
                    if(torneo.torneo.toString() == data._id.toString()){
                        ranking.push({player: player, statistics: torneo.statistics});
                    }
                })
            });

            ranking.sort((a, b) => {
                if(a.statistics.puntosExtra != undefined && b.statistics.puntosExtra != undefined){
                    if (a.statistics.puntosExtra > b.statistics.puntosExtra)
                    return -1;

                    else if (a.statistics.puntosExtra < b.statistics.puntosExtra)
                        return 1;

                    else{
                        if (a.statistics.puntos > b.statistics.puntos)
                            return -1;

                        else if (a.statistics.puntos < b.statistics.puntos)
                            return 1;
                        
                        else {
                            if (a.statistics.juegosDif > b.statistics.juegosDif)
                                return -1;

                            else return 1;
                        }
                    }
                } else {
                    if (a.statistics.puntos > b.statistics.puntos)
                    return -1;

                    else if (a.statistics.puntos < b.statistics.puntos)
                        return 1;
                    
                    else {
                        if (a.statistics.juegosDif > b.statistics.juegosDif)
                            return -1;

                        else return 1;
                    }
                }                
            })
            console.log("Ranking", ranking[0].player._id);
            resolve(ranking[0].player._id);
        });
    })
}

export default { getTorneo, getTorneos, getTorneosUser, getGanador, createTorneo, joinTorneo, leaveTorneo, checkStartTorneos, checkStartVueltas, getVueltas, getRanking }
