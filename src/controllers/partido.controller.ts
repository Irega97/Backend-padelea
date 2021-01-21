import { Request, Response } from "express";
import Partido from "../models/partido";
import User from "../models/user";
import Torneo from "../models/torneo";

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
    //Info partido
    const idPartido = req.body.idPartido;
    let partido: any;

    //Variables para estadisticas
    const juegos1 = req.body.juegos1;
    const juegos2 = req.body.juegos2;
    const sets1 = req.body.sets1;
    const sets2 = req.body.sets2;
    const ganadores = req.body.ganadores;
    
    //Variables auxiliares
    let torneo: any;
    let ronda: any;
<<<<<<< HEAD
    let nombreGrupo: any;
    let confirmed: number = 0;
    let cambiar: Boolean = true;

    //Buscamos torneo al que pertenece el partido
=======
>>>>>>> b683357802d0a0f16475aa437d777a07d9e43d0f
    await Torneo.findOne({"_id": req.body.idTorneo}).then((data) => {
        torneo = data;
    });
    if (torneo != null) confirmed = torneo.partidosConfirmados + 1;
    
    Partido.findOne({"_id":idPartido}).then((data) => {
        if(data == null) return res.status(404).json({message: 'Partido not found'})
        else{
            //Recogemos información del torneo del partido
            partido = data;
            ronda = data.torneo.vuelta;
            nombreGrupo = data.torneo.grupo;

            //Comprueba que el partido no se haya modificado ya
            if (data.resultado != '{}'){
                cambiar = false;
            }

            //Recoge los resultados de los sets
            const set1: string = req.body.set1;
            const set2: string = req.body.set2;
            let set3: string;
            if(req.body.set3 != null){
                set3 = req.body.set3;
            } else set3 = ''; 
            
            //Creamos objeto resultado
            let resultado: any;
            if(set3!='') resultado = {set1:set1, set2:set2, set3:set3};
            else resultado = {set1:set1, set2: set2, set3:''};
            
            //Actualizamos el partido
            Partido.findOneAndUpdate({"_id": idPartido}, {$set: {resultado: resultado, ganadores:ganadores}}).then((data)  =>  {
                //Si no se ha modificado antes, sumamos un numero a partidos confirmados
                if (cambiar){
                    Torneo.findOneAndUpdate({"_id": req.body.idTorneo}, {$set: {partidosConfirmados: confirmed}});
                }
<<<<<<< HEAD
                //Calculamos las estadisticas
                calculateStatistics(sets1, sets2, juegos1, juegos2, ganadores, torneo, partido, ronda, nombreGrupo).then((hecho) => {
                    if(hecho == true) return res.status(200).json(data);
                    else return res.status(400).json({message: "Bad Request"});
                });
=======

                /*partido.jugadores.forEach((pareja: any) => {
                    if(pareja == ganadores){
                        if(partido.jugadores.indexOf(pareja) == 0){
                            
                        }
                    }
                })*/

                res.status(200).json(data);
>>>>>>> b683357802d0a0f16475aa437d777a07d9e43d0f
            }).catch((err)  => {
                res.status(500).json(err);
            });
        }
    });
}

async function calculateStatistics(sets1: any, sets2: any, juegos1: any, juegos2: any, ganadores: any, torneo: any, partido:any, ronda: any, nombreGrupo: any){
    //Variable del return
    let hecho = false;
    
    //ID's de los jugadores
    let u1: any, u2: any, u3: any, u4: any;
    u1 = partido.jugadores.pareja1[0];
    u2 = partido.jugadores.pareja1[1];
    u3 = partido.jugadores.pareja2[0];
    u4 = partido.jugadores.pareja2[1];

    //Estadisticas de cada jugador
    let stats1, stats2, stats3, stats4;
    User.findOne({"_id": u1}, {statistics: 1}).then((data) => {
        stats1 = data?.statistics;
    });
    User.findOne({"_id": u2}, {statistics: 1}).then((data) => {
        stats2 = data?.statistics;
    });  
    User.findOne({"_id": u3}, {statistics: 1}).then((data) => {
        stats3 = data?.statistics;
    });
    User.findOne({"_id": u4}, {statistics: 1}).then((data) => {
        stats4 = data?.statistics;
    });  

    //Variables auxiliares
    let parejaGanadora: number;

    if(partido.jugadores.pareja1 == ganadores) {
        parejaGanadora = 0;
    } else parejaGanadora = 1;

    try{
        //Si el partido es de la previa...
        if(ronda == 'previa'){
            torneo.previa.grupos.forEach((grupo: any) => {
                // ... y esta en ese grupo ...
                if(grupo.groupName == nombreGrupo) {
                    grupo.classification.forEach((player: any) => {
                        // Si ha ganado
                        if(player.player == ganadores[0] || player.player == ganadores[1]){
                            //Partidos
                            player.statistics.partidosJugados = player.statistics.partidosJugados++;
                            player.statistics.partidosGanados = player.statistics.partidosGanados++;
                            
                            //Sets
                            if(parejaGanadora == 0) {
                                player.statistics.setsGanados = sets1;
                                if(sets1 == 1) player.statistics.setsPerdidos = player.statistics.setsPerdidos++;
                                else player.statistics.setsPerdidos = player.statistics.setsPerdidos + 2;
                            }
                            else {
                                player.statistics.setsGanados = sets2;
                                if(sets2 == 1) player.statistics.setsPerdidos = player.statistics.setsPerdidos++;
                                else player.statistics.setsPerdidos = player.statistics.setsPerdidos + 2;
                            }
                        } 
                        // Si ha perdido
                        else {
                            // Partidos
                            player.statistics.partidosJugados = player.statistics.partidosJugados++;
                            player.statistics.partidosPerdidos = player.statistics.partidosPerdidos++;
                            
                            // Sets
                            if(parejaGanadora == 0) {
                                player.statistics.setsGanados = sets1;
                                if(sets1 == 1) player.statistics.setsPerdidos = player.statistics.setsPerdidos++;
                                else player.statistics.setsPerdidos = player.statistics.setsPerdidos + 2;
                            }
                            else {
                                player.statistics.setsGanados = sets2;
                                if(sets2 == 1) player.statistics.setsPerdidos = player.statistics.setsPerdidos++;
                                else player.statistics.setsPerdidos = player.statistics.setsPerdidos + 2;
                            }
                        }
                        console.log(player.statistics);
                    })
                }
            })
        }
        /* partidosJugados: number;
        partidosGanados: number;
        partidosPerdidos: number;
        setsGanados: number;
        setsPerdidos: number;
        juegosGanados: number;
        juegosPerdidos: number;
        juegosDif: number; */
        
        /* 

        if(j==0){
            console.log();
        } else {

        }
 */
        hecho = true;
    } catch (error) {
        console.log(error);
    }

    return hecho;
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

function getInfoGrupos(req: Request, res: Response){
    Torneo.findOne({"name": req.params.name}, {previa: 1, rondas: 1}).populate({path: 'previa rondas', populate: {path: 'grupos', 
    populate: [{path: 'classification', populate: {path: 'player', select: 'username image'}}, 
    {path: 'partidos', populate: {path: 'jugadores', populate: {path: 'pareja1 pareja2', select: 'username image'}}}]}}).then((data) => {
        if (data != undefined){
            let dataToSend;
            let enc: Boolean = false;
            let i: number = 0;
            if (req.params.vuelta == "Previa"){
                while (i< data.previa.grupos.length && !enc){
                    if (data.previa.grupos[i].groupName == req.params.grupo){
                        enc = true;
                        dataToSend = {
                            grupos: data.previa.grupos[i],
                            idTorneo: data._id
                        }
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
                            dataToSend = {
                                grupos: data.rondas[i].grupos[j],
                                idTorneo: data._id
                            } 
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

export default { getPartidosTorneo, getPartidosUser, addPartido, getInfoGrupos, addResultados}
