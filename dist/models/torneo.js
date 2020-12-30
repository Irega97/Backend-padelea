"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/* nombre, descripcion, url, responsable */
const mongoose_1 = __importStar(require("mongoose"));
//Modelo de objeto que se guarda en la BBDD de MongoDB
let torneoSchema = mongoose_1.default.Schema;
const torneo = new torneoSchema({
    name: {
        type: String
    },
    type: {
        type: String
    },
    description: {
        type: String
    },
    image: {
        type: String
    },
    fechaInicio: {
        type: Date
    },
    finInscripcion: {
        type: Date
    },
    ubicacion: {
        type: String
    },
    reglamento: {
        type: String
    },
    numRondas: {
        type: Number
    },
    admin: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    maxPlayers: {
        type: Number
    },
    finalizado: {
        type: Boolean
    },
    players: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    cola: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    rondas: [{
            numero: {
                type: Number
            },
            fechaFin: {
                type: Date
            }
        }],
    previa: [{
            groupName: {
                type: String
            },
            classification: [{
                    member: {
                        type: mongoose_1.Schema.Types.ObjectId,
                        ref: 'User'
                    },
                    position: {
                        type: Number
                    }
                }]
        }],
    grupos: [{
            groupName: {
                type: String
            },
            classification: [{
                    member: {
                        type: mongoose_1.Schema.Types.ObjectId,
                        ref: 'User'
                    },
                    position: {
                        type: Number
                    }
                }]
        }]
});
torneo.methods.torneoToJSON = function () {
    return {
        name: this.name,
        type: this.type,
        description: this.description,
        image: this.image,
        fechaInicio: this.fechaInicio,
        finInscripcion: this.finInscripcion,
        ubicacion: this.ubicacion,
        reglamento: this.reglamento,
        numRondas: this.numRondas,
        admin: this.admin,
        maxPlayers: this.maxPlayers,
        finalizado: this.finalizado,
        players: this.players,
        cola: this.cola,
        rondas: this.rondas,
        previa: this.previa,
        grupos: this.grupos
    };
};
//Exportamos modelo para poder usarlo
exports.default = mongoose_1.default.model('Torneo', torneo);
