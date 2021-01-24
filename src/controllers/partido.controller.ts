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
    let nombreGrupo: any;
    let confirmed: number = 0;
    let cambiar: Boolean = true;

    //Buscamos torneo al que pertenece el partido
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
            Partido.findOneAndUpdate({"_id": idPartido}, {$set: {resultado: resultado, ganadores:ganadores}}).then(async (data)  =>  {
                //Si no se ha modificado antes, sumamos un numero a partidos confirmados
                if (cambiar)
                    await Torneo.findOneAndUpdate({"_id": req.body.idTorneo}, {$set: {partidosConfirmados: confirmed}});

                //Calculamos las estadisticas
                calculateStatistics(sets1, sets2, juegos1, juegos2, ganadores, torneo, partido, ronda, nombreGrupo, cambiar).then(async (hecho) => {
                    if(hecho) {
                        await Torneo.updateOne({"_id":torneo._id},{$set: {previa: torneo.previa, rondas: torneo.rondas}}).then((data) => {
                            if(data.nModified!=1) return res.status(400).json({message: "Bad Request"});
                            else return res.status(200).json(torneo);
                        });
                    }
                    else return res.status(400).json({message: "Bad Request"});
                });             
            }).catch((err)  => {
                res.status(500).json(err);
            });
        }
    });
}

async function calculateStatistics(sets1: any, sets2: any, juegos1: any, juegos2: any, ganadores: any, torneo: any, partido:any, ronda: any, nombreGrupo: any, cambiar: Boolean){
    //Variable del return
    let hecho = true;
    
    //ID's de los jugadores
    let u1: any, u2: any, u3: any, u4: any;
    u1 = partido.jugadores.pareja1[0];
    u2 = partido.jugadores.pareja1[1];
    u3 = partido.jugadores.pareja2[0];
    u4 = partido.jugadores.pareja2[1];

    await User.findOne({"_id": u1}, {torneos: 1, statistics: 1}).then((data) => {
        u1 = data;
    });
    await User.findOne({"_id": u2}, {torneos: 1, statistics: 1}).then((data) => {
        u2 = data;
    });  
    await User.findOne({"_id": u3}, {torneos: 1, statistics: 1}).then((data) => {
        u3 = data;
    });
    await User.findOne({"_id": u4}, {torneos : 1, statistics: 1}).then((data) => {
        u4 = data;
    });  

    let statsPareja1 = {
        partidosJugados: 1,
        partidosGanados: 0,
        partidosPerdidos: 0,
        juegosGanados: juegos1,
        juegosPerdidos: juegos2,
        juegosDif: juegos1 - juegos2,
        setsGanados: sets1,
        setsPerdidos: sets2,
        puntos: 0
    }

    let statsPareja2 = {
        partidosJugados: 1,
        partidosGanados: 0,
        partidosPerdidos: 0,
        juegosGanados: juegos2,
        juegosPerdidos: juegos1,
        juegosDif: juegos2 - juegos1,
        setsGanados: sets2,
        setsPerdidos: sets1,
        puntos: 0
    }

    let statsPareja1Viejo = {
        partidosJugados: 0,
        partidosGanados: 0,
        partidosPerdidos: 0,
        juegosGanados: 0,
        juegosPerdidos: 0,
        juegosDif: 0,
        setsGanados: 0,
        setsPerdidos: 0,
        puntos: 0
    }

    let statsPareja2Viejo = {
        partidosJugados: 0,
        partidosGanados: 0,
        partidosPerdidos: 0,
        juegosGanados: 0,
        juegosPerdidos: 0,
        juegosDif: 0,
        setsGanados: 0,
        setsPerdidos: 0,
        puntos: 0
    }

    if (ganadores[0]._id.toString() == partido.jugadores.pareja1[0].toString() || ganadores[1]._id.toString() == partido.jugadores.pareja1[0].toString()){
        statsPareja1.partidosGanados = 1;
        statsPareja1.puntos = 2 + sets1;
        statsPareja2.partidosPerdidos = 1;
        statsPareja2.puntos = 1 + sets2;
    }

    else{
        statsPareja2.partidosGanados = 1;
        statsPareja2.puntos = 2 + sets2;
        statsPareja1.partidosPerdidos = 1;
        statsPareja1.puntos = 1 + sets1;
    }

    if (!cambiar){
        statsPareja1Viejo.partidosJugados = 1;
        statsPareja2Viejo.partidosJugados = 1;
        let res1v= partido.resultado.set1.split('-');
        let res2v= partido.resultado.set2.split('-');
        let sets1v = 0;
        let sets2v = 0;
        statsPareja1Viejo.juegosGanados = parseInt(res1v[0]) + parseInt(res2v[0]);
        statsPareja2Viejo.juegosGanados = parseInt(res1v[1]) + parseInt(res2v[1]);
        statsPareja1Viejo.juegosPerdidos = statsPareja2Viejo.juegosGanados;
        statsPareja2Viejo.juegosPerdidos = statsPareja1Viejo.juegosGanados;
        statsPareja1Viejo.juegosDif = statsPareja1Viejo.juegosGanados - statsPareja1Viejo.juegosPerdidos;
        statsPareja2Viejo.juegosDif = statsPareja2Viejo.juegosGanados - statsPareja2Viejo.juegosPerdidos;
         
        if (parseInt(res1v[0]) > parseInt(res1v[1])) sets1v++;
        else sets2v++;
        if (parseInt(res2v[0]) > parseInt(res2v[1])) sets1v++;
        else sets2v++;

        statsPareja1Viejo.setsGanados = sets1v;
        statsPareja1Viejo.setsPerdidos = sets2v;
        statsPareja2Viejo.setsGanados = sets2v;
        statsPareja2Viejo.setsPerdidos = sets1v;
        if (partido.ganadores[0].toString() == u1._id.toString() || partido.ganadores[0].toString() == u2._id.toString()){
            statsPareja1Viejo.partidosGanados = 1;
            statsPareja2Viejo.partidosPerdidos = 1;
            statsPareja1Viejo.puntos = 2 + sets1v;
            statsPareja2Viejo.puntos = 1 + sets2v;
        }

        else{
            statsPareja2Viejo.partidosGanados = 1;
            statsPareja1Viejo.partidosPerdidos = 1;
            statsPareja2Viejo.puntos = 2 + sets1v;
            statsPareja1Viejo.puntos = 1 + sets2v;
        }
    }

    u1.statistics.partidosJugados = u1.statistics.partidosJugados + statsPareja1.partidosJugados - statsPareja1Viejo.partidosJugados;
    u1.statistics.partidosGanados = u1.statistics.partidosGanados + statsPareja1.partidosGanados - statsPareja1Viejo.partidosGanados;
    u1.statistics.partidosPerdidos = u1.statistics.partidosPerdidos + statsPareja1.partidosPerdidos - statsPareja1Viejo.partidosPerdidos;
    u1.statistics.setsGanados = u1.statistics.setsGanados + statsPareja1.setsGanados - statsPareja1Viejo.setsGanados;
    u1.statistics.setsPerdidos = u1.statistics.setsPerdidos + statsPareja1.setsPerdidos - statsPareja1Viejo.setsPerdidos;
    u1.statistics.juegosPerdidos = u1.statistics.juegosPerdidos + statsPareja1.juegosPerdidos - statsPareja1Viejo.juegosPerdidos;
    u1.statistics.juegosGanados = u1.statistics.juegosGanados + statsPareja1.juegosGanados - statsPareja1Viejo.juegosGanados;
    u1.statistics.juegosDif = u1.statistics.juegosDif + statsPareja1.juegosDif - statsPareja1Viejo.juegosDif;

    u2.statistics.partidosJugados = u2.statistics.partidosJugados + statsPareja1.partidosJugados - statsPareja1Viejo.partidosJugados;
    u2.statistics.partidosGanados = u2.statistics.partidosGanados + statsPareja1.partidosGanados - statsPareja1Viejo.partidosGanados;
    u2.statistics.partidosPerdidos = u2.statistics.partidosPerdidos + statsPareja1.partidosPerdidos - statsPareja1Viejo.partidosPerdidos;
    u2.statistics.setsGanados = u2.statistics.setsGanados + statsPareja1.setsGanados - statsPareja1Viejo.setsGanados;
    u2.statistics.setsPerdidos = u2.statistics.setsPerdidos + statsPareja1.setsPerdidos - statsPareja1Viejo.setsPerdidos;
    u2.statistics.juegosPerdidos = u2.statistics.juegosPerdidos + statsPareja1.juegosPerdidos - statsPareja1Viejo.juegosPerdidos;
    u2.statistics.juegosGanados = u2.statistics.juegosGanados + statsPareja1.juegosGanados - statsPareja1Viejo.juegosGanados;
    u2.statistics.juegosDif = u2.statistics.juegosDif + statsPareja1.juegosDif - statsPareja1Viejo.juegosDif;

    u3.statistics.partidosJugados = u3.statistics.partidosJugados + statsPareja2.partidosJugados - statsPareja2Viejo.partidosJugados;
    u3.statistics.partidosGanados = u3.statistics.partidosGanados + statsPareja2.partidosGanados - statsPareja2Viejo.partidosGanados;
    u3.statistics.partidosPerdidos = u3.statistics.partidosPerdidos + statsPareja2.partidosPerdidos - statsPareja2Viejo.partidosPerdidos;
    u3.statistics.setsGanados = u3.statistics.setsGanados + statsPareja2.setsGanados - statsPareja2Viejo.setsGanados;
    u3.statistics.setsPerdidos = u3.statistics.setsPerdidos + statsPareja2.setsPerdidos - statsPareja2Viejo.setsPerdidos;
    u3.statistics.juegosPerdidos = u3.statistics.juegosPerdidos + statsPareja2.juegosPerdidos - statsPareja2Viejo.juegosPerdidos;
    u3.statistics.juegosGanados = u3.statistics.juegosGanados + statsPareja2.juegosGanados - statsPareja2Viejo.juegosGanados;
    u3.statistics.juegosDif = u3.statistics.juegosDif + statsPareja2.juegosDif - statsPareja2Viejo.juegosDif;

    u4.statistics.partidosJugados = u4.statistics.partidosJugados + statsPareja2.partidosJugados - statsPareja2Viejo.partidosJugados;
    u4.statistics.partidosGanados = u4.statistics.partidosGanados + statsPareja2.partidosGanados - statsPareja2Viejo.partidosGanados;
    u4.statistics.partidosPerdidos = u4.statistics.partidosPerdidos + statsPareja2.partidosPerdidos - statsPareja2Viejo.partidosPerdidos;
    u4.statistics.setsGanados = u4.statistics.setsGanados + statsPareja2.setsGanados - statsPareja2Viejo.setsGanados;
    u4.statistics.setsPerdidos = u4.statistics.setsPerdidos + statsPareja2.setsPerdidos - statsPareja2Viejo.setsPerdidos;
    u4.statistics.juegosPerdidos = u4.statistics.juegosPerdidos + statsPareja2.juegosPerdidos - statsPareja2Viejo.juegosPerdidos;
    u4.statistics.juegosGanados = u4.statistics.juegosGanados + statsPareja2.juegosGanados - statsPareja2Viejo.juegosGanados;
    u4.statistics.juegosDif = u4.statistics.juegosDif + statsPareja2.juegosDif - statsPareja2Viejo.juegosDif;

    await u1.torneos.forEach((t: any) => {
        if(t.torneo.toString() == torneo._id.toString()){
            t.statistics.partidosJugados = t.statistics.partidosJugados + statsPareja1.partidosJugados - statsPareja1Viejo.partidosJugados;
            t.statistics.partidosGanados = t.statistics.partidosGanados + statsPareja1.partidosGanados - statsPareja1Viejo.partidosGanados;
            t.statistics.partidosPerdidos = t.statistics.partidosPerdidos + statsPareja1.partidosPerdidos - statsPareja1Viejo.partidosPerdidos;
            t.statistics.setsGanados = t.statistics.setsGanados + statsPareja1.setsGanados - statsPareja1Viejo.setsGanados;
            t.statistics.setsPerdidos = t.statistics.setsPerdidos + statsPareja1.setsPerdidos - statsPareja1Viejo.setsPerdidos;
            t.statistics.juegosPerdidos = t.statistics.juegosPerdidos + statsPareja1.juegosPerdidos - statsPareja1Viejo.juegosPerdidos;
            t.statistics.juegosGanados = t.statistics.juegosGanados + statsPareja1.juegosGanados - statsPareja1Viejo.juegosGanados;
            t.statistics.juegosDif = t.statistics.juegosDif + statsPareja1.juegosDif - statsPareja1Viejo.juegosDif;
            t.statistics.puntos = t.statistics.puntos + statsPareja1.puntos - statsPareja1Viejo.puntos;
        }
    });
    await User.updateOne({"_id": u1._id}, {$set: {torneos: u1.torneos, statistics: u1.statistics}}).then((data) => {
        if(data.nModified != 1) hecho = false;
    });

    await u2.torneos.forEach((t: any) => {
        if(t.torneo.toString() == torneo._id.toString()){
            t.statistics.partidosJugados = t.statistics.partidosJugados + statsPareja1.partidosJugados - statsPareja1Viejo.partidosJugados;
            t.statistics.partidosGanados = t.statistics.partidosGanados + statsPareja1.partidosGanados - statsPareja1Viejo.partidosGanados;
            t.statistics.partidosPerdidos = t.statistics.partidosPerdidos + statsPareja1.partidosPerdidos - statsPareja1Viejo.partidosPerdidos;
            t.statistics.setsGanados = t.statistics.setsGanados + statsPareja1.setsGanados - statsPareja1Viejo.setsGanados;
            t.statistics.setsPerdidos = t.statistics.setsPerdidos + statsPareja1.setsPerdidos - statsPareja1Viejo.setsPerdidos;
            t.statistics.juegosPerdidos = t.statistics.juegosPerdidos + statsPareja1.juegosPerdidos - statsPareja1Viejo.juegosPerdidos;
            t.statistics.juegosGanados = t.statistics.juegosGanados + statsPareja1.juegosGanados - statsPareja1Viejo.juegosGanados;
            t.statistics.juegosDif = t.statistics.juegosDif + statsPareja1.juegosDif - statsPareja1Viejo.juegosDif;
            t.statistics.puntos = t.statistics.puntos + statsPareja1.puntos - statsPareja1Viejo.puntos;
        }
    });
    await User.updateOne({"_id": u2._id}, {$set: {torneos: u2.torneos, statistics: u2.statistics}}).then((data) => {
        if(data.nModified != 1) hecho = false;
    });

    await u3.torneos.forEach((t: any) => {
        if(t.torneo.toString() == torneo._id.toString()){
            t.statistics.partidosJugados = t.statistics.partidosJugados + statsPareja2.partidosJugados - statsPareja2Viejo.partidosJugados;
            t.statistics.partidosGanados = t.statistics.partidosGanados + statsPareja2.partidosGanados - statsPareja2Viejo.partidosGanados;
            t.statistics.partidosPerdidos = t.statistics.partidosPerdidos + statsPareja2.partidosPerdidos - statsPareja2Viejo.partidosPerdidos;
            t.statistics.setsGanados = t.statistics.setsGanados + statsPareja2.setsGanados - statsPareja2Viejo.setsGanados;
            t.statistics.setsPerdidos = t.statistics.setsPerdidos + statsPareja2.setsPerdidos - statsPareja2Viejo.setsPerdidos;
            t.statistics.juegosPerdidos = t.statistics.juegosPerdidos + statsPareja2.juegosPerdidos - statsPareja2Viejo.juegosPerdidos;
            t.statistics.juegosGanados = t.statistics.juegosGanados + statsPareja2.juegosGanados - statsPareja2Viejo.juegosGanados;
            t.statistics.juegosDif = t.statistics.juegosDif + statsPareja2.juegosDif - statsPareja2Viejo.juegosDif;
            t.statistics.puntos = t.statistics.puntos + statsPareja2.puntos  - statsPareja2Viejo.puntos;
        }
    });
    await User.updateOne({"_id": u3._id}, {$set: {torneos: u3.torneos, statistics: u3.statistics}}).then((data) => {
        if(data.nModified != 1) hecho = false;
    });

    await u4.torneos.forEach((t: any) => {
        if(t.torneo.toString() == torneo._id.toString()){
            t.statistics.partidosJugados = t.statistics.partidosJugados + statsPareja2.partidosJugados - statsPareja2Viejo.partidosJugados;
            t.statistics.partidosGanados = t.statistics.partidosGanados + statsPareja2.partidosGanados - statsPareja2Viejo.partidosGanados;
            t.statistics.partidosPerdidos = t.statistics.partidosPerdidos + statsPareja2.partidosPerdidos - statsPareja2Viejo.partidosPerdidos;
            t.statistics.setsGanados = t.statistics.setsGanados + statsPareja2.setsGanados - statsPareja2Viejo.setsGanados;
            t.statistics.setsPerdidos = t.statistics.setsPerdidos + statsPareja2.setsPerdidos - statsPareja2Viejo.setsPerdidos;
            t.statistics.juegosPerdidos = t.statistics.juegosPerdidos + statsPareja2.juegosPerdidos - statsPareja2Viejo.juegosPerdidos;
            t.statistics.juegosGanados = t.statistics.juegosGanados + statsPareja2.juegosGanados - statsPareja2Viejo.juegosGanados;
            t.statistics.juegosDif = t.statistics.juegosDif + statsPareja2.juegosDif - statsPareja2Viejo.juegosDif;
            t.statistics.puntos = t.statistics.puntos + statsPareja2.puntos - statsPareja2Viejo.puntos;
        }
    });
    await User.updateOne({"_id": u4._id}, {$set: {torneos: u4.torneos, statistics: u4.statistics}}).then((data) => {
        if(data.nModified != 1) hecho = false;
    });

    if(ronda == 'previa'){
        torneo.previa.grupos.forEach((grupo: any) => {
            if(grupo.groupName.toString() == nombreGrupo.toString()) {
                grupo.classification.forEach((player: any) => {
                    // Si es pareja1
                    if(player.player.toString() == u1._id.toString() || player.player.toString() == u2._id.toString()){
                        player.statistics.partidosJugados = player.statistics.partidosJugados + statsPareja1.partidosJugados - statsPareja1Viejo.partidosJugados;
                        player.statistics.partidosGanados = player.statistics.partidosGanados + statsPareja1.partidosGanados - statsPareja1Viejo.partidosGanados;
                        player.statistics.partidosPerdidos = player.statistics.partidosPerdidos + statsPareja1.partidosPerdidos - statsPareja1Viejo.partidosPerdidos;
                        player.statistics.setsGanados = player.statistics.setsGanados + statsPareja1.setsGanados - statsPareja1Viejo.setsGanados;
                        player.statistics.setsPerdidos = player.statistics.setsPerdidos + statsPareja1.setsPerdidos - statsPareja1Viejo.setsPerdidos;
                        player.statistics.juegosPerdidos = player.statistics.juegosPerdidos + statsPareja1.juegosPerdidos - statsPareja1Viejo.juegosPerdidos;
                        player.statistics.juegosGanados = player.statistics.juegosGanados + statsPareja1.juegosGanados - statsPareja1Viejo.juegosGanados;
                        player.statistics.juegosDif = player.statistics.juegosDif + statsPareja1.juegosDif - statsPareja1Viejo.juegosDif;
                        player.statistics.puntos = player.statistics.puntos + statsPareja1.puntos - statsPareja1Viejo.puntos;
                    } 
                    // Si es pareja2
                    else {
                        player.statistics.partidosJugados = player.statistics.partidosJugados + statsPareja2.partidosJugados - statsPareja2Viejo.partidosJugados;
                        player.statistics.partidosGanados = player.statistics.partidosGanados + statsPareja2.partidosGanados - statsPareja2Viejo.partidosGanados;
                        player.statistics.partidosPerdidos = player.statistics.partidosPerdidos + statsPareja2.partidosPerdidos - statsPareja2Viejo.partidosPerdidos;
                        player.statistics.setsGanados = player.statistics.setsGanados + statsPareja2.setsGanados - statsPareja2Viejo.setsGanados;
                        player.statistics.setsPerdidos = player.statistics.setsPerdidos + statsPareja2.setsPerdidos - statsPareja2Viejo.setsPerdidos;
                        player.statistics.juegosPerdidos = player.statistics.juegosPerdidos + statsPareja2.juegosPerdidos - statsPareja2Viejo.juegosPerdidos;
                        player.statistics.juegosGanados = player.statistics.juegosGanados + statsPareja2.juegosGanados - statsPareja2Viejo.juegosGanados;
                        player.statistics.juegosDif = player.statistics.juegosDif + statsPareja2.juegosDif - statsPareja2Viejo.juegosDif;
                        player.statistics.puntos = player.statistics.puntos + statsPareja2.puntos - statsPareja2Viejo.puntos;
                    }
                });
                
                grupo.classification.sort((a: any,b: any) => {
                    if (a.statistics.puntos > b.statistics.puntos)
                        return -1;

                    else if (a.statistics.puntos < b.statistics.puntos)
                        return 1;

                    else{
                        if (a.statistics.juegosDif > b.statistics.juegosDif)
                            return -1;

                        else return 1;
                    }
                })
            }
        })
    }

    else{
        let i: number = 0;
        let aux: boolean = false;
        torneo.rondas.forEach((round: any) => {
            if(round.name == ronda) {
                i = torneo.rondas.indexOf(round);
                aux = true;
            } else hecho = false;
        });
        if(aux) torneo.rondas[i].grupos.forEach((grupo: any) => {
            if(grupo.groupName.toString() == nombreGrupo.toString()) {
                grupo.classification.forEach((player: any) => {
                    // Si ha ganado
                    if(player.player.toString() == u1._id.toString() || player.player.toString() == u2._id.toString()){
                        player.statistics.partidosJugados = player.statistics.partidosJugados + statsPareja1.partidosJugados - statsPareja1Viejo.partidosJugados;
                        player.statistics.partidosGanados = player.statistics.partidosGanados + statsPareja1.partidosGanados - statsPareja1Viejo.partidosGanados;
                        player.statistics.partidosPerdidos = player.statistics.partidosPerdidos + statsPareja1.partidosPerdidos - statsPareja1Viejo.partidosPerdidos;
                        player.statistics.setsGanados = player.statistics.setsGanados + statsPareja1.setsGanados - statsPareja1Viejo.setsGanados;
                        player.statistics.setsPerdidos = player.statistics.setsPerdidos + statsPareja1.setsPerdidos - statsPareja1Viejo.setsPerdidos;
                        player.statistics.juegosPerdidos = player.statistics.juegosPerdidos + statsPareja1.juegosPerdidos - statsPareja1Viejo.juegosPerdidos;
                        player.statistics.juegosGanados = player.statistics.juegosGanados + statsPareja1.juegosGanados - statsPareja1Viejo.juegosGanados;
                        player.statistics.juegosDif = player.statistics.juegosDif + statsPareja1.juegosDif - statsPareja1Viejo.juegosDif;
                        player.statistics.puntos = player.statistics.puntos + statsPareja1.puntos - statsPareja1Viejo.puntos;
                    } 
                    // Si ha perdido
                    else {
                        player.statistics.partidosJugados = player.statistics.partidosJugados + statsPareja2.partidosJugados - statsPareja2Viejo.partidosJugados;
                        player.statistics.partidosGanados = player.statistics.partidosGanados + statsPareja2.partidosGanados - statsPareja2Viejo.partidosGanados;
                        player.statistics.partidosPerdidos = player.statistics.partidosPerdidos + statsPareja2.partidosPerdidos - statsPareja2Viejo.partidosPerdidos;
                        player.statistics.setsGanados = player.statistics.setsGanados + statsPareja2.setsGanados - statsPareja2Viejo.setsGanados;
                        player.statistics.setsPerdidos = player.statistics.setsPerdidos + statsPareja2.setsPerdidos - statsPareja2Viejo.setsPerdidos;
                        player.statistics.juegosPerdidos = player.statistics.juegosPerdidos + statsPareja2.juegosPerdidos - statsPareja2Viejo.juegosPerdidos;
                        player.statistics.juegosGanados = player.statistics.juegosGanados + statsPareja2.juegosGanados - statsPareja2Viejo.juegosGanados;
                        player.statistics.juegosDif = player.statistics.juegosDif + statsPareja2.juegosDif - statsPareja2Viejo.juegosDif;
                        player.statistics.puntos = player.statistics.puntos + statsPareja2.puntos - statsPareja2Viejo.puntos;
                    }
                })
            }
        })
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
                    if (data.rondas[i].name == req.params.vuelta)
                        enc = true;

                    else
                        i++;
                }

                if (enc){
                    enc = false;
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
