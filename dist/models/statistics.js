"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
let statisticsSchema = mongoose_1.default.Schema;
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
statistics.methods.mensajeToJSON = function () {
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
};
//Exportamos modelo para poder usarlo
exports.default = mongoose_1.default.model('Statistics', statistics);
