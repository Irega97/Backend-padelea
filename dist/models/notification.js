"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
//Modelo de objeto que se guarda en la BBDD de MongoDB
let notificationSchema = mongoose_1.default.Schema;
const notification = new notificationSchema({
    /* _id: {
        type: Schema.Types.ObjectId
    }, */
    type: {
        type: String
    },
    description: {
        type: String
    },
    status: {
        type: Number
    },
    origen: {
        type: String
    }
});
notification.methods.notificationToJSON = function () {
    return {
        type: this.type,
        description: this.description,
        status: this.status,
        origen: this.origen
    };
};
//Exportamos modelo para poder usarlo
exports.default = mongoose_1.default.model('Notification', notification);
