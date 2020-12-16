import mongoose, { Document} from 'mongoose';

let statisticsSchema = mongoose.Schema;
const statistics = new statisticsSchema({
    partidosJugados: {
        type: Number
    },
    partidosGanados: {
        type: Number
    },
    partidosPerdidos: {
        type: Number
    },
    setsGanados: {
        type: Number
    },
    setsPerdidos: {
        type: Number
    },
    juegosGanados: {
        type: Number
    },
    juegosPerdidos: {
        type: Number
    },
    juegosDif: {
        type: Number
    },
    puntos: {
        type: Number
    },
    puntosExtra: {
        type: Number
    }
});

//Interfaz para tratar respuesta como documento
export interface IStatistics extends Document {
    partidosJugados: number;
    partidosGanados: number;
    partidosPerdidos: number;
    setsGanados: number;
    setsPerdidos: number;
    juegosGanados: number;
    juegosPerdidos: number;
    juegosDif: number;
    puntos: number;
    puntosExtra: number;
    statisticsToJson(): JSON;
}

statistics.methods.mensajeToJSON = function(){
    return {
        partidosJugados: this.partidosJugados,
        partidosGanados: this.partidosGanados,
        partidosPerdidos: this.partidosPerdidos,
        setsGanados: this.setsGanados,
        setsPerdidos: this.setsPerdidos,
        juegosGanados: this.juegosGanados,
        juegosPerdidos: this.juegosPerdidos,
        juegosDif: this.juegosDif,
        puntos: this.puntos,
        puntosExtra: this.puntosExtra
    };
}

//Exportamos modelo para poder usarlo
export default mongoose.model<IStatistics>('Statistics', statistics);