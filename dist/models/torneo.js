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
    /* _id: {
        type: Schema.Types.ObjectId
    }, */
    name: {
        type: String
    },
    admin: [{
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            }
        }],
    players: [{
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            }
        }]
});
torneo.methods.torneoToJSON = function () {
    return {
        name: this.name,
        admin: this.admin,
        players: this.players
    };
};
//Exportamos modelo para poder usarlo
exports.default = mongoose_1.default.model('Torneo', torneo);
