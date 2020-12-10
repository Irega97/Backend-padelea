"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//FICHERO EJECUCIÓN DEL PROYECTO
const app_1 = __importDefault(require("./app")); //app exportada en app.ts
//Ejecutamos la conexion a la BBDD antes de escuchar al server
require("./database");
app_1.default.listen(app_1.default.get('port')); //Recuperamos puerto de app.ts
console.log('Server in port', app_1.default.get('port'));
