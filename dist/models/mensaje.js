"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
let mensajeSchema = mongoose_1.default.Schema;
const mensaje = new mensajeSchema({
    /* _id: {
        type: Schema.Types.ObjectId
    }, */
    body: {
        type: String,
    },
    date: {
        type: Date,
    }
});
mensaje.methods.mensajeToJSON = function () {
    return {
        body: this.body,
        date: this.date
    };
};
exports.default = mongoose_1.default.model('Mensaje', mensaje);
