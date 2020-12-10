"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//Configuraciones para conexion con BBDD
exports.default = {
    DB: {
        URI: process.env.MONGODB_URI || 'mongodb://localhost/proyectoEA',
    },
    jwtSecret: 'chulibobito',
    defaultImage: 'https://res.cloudinary.com/dyjz5e9a6/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1606479202/default%20images/default_ktlol4.png'
};
