//Configuraciones para conexion con BBDD
export default {
    DB: {
        URI: process.env.MONGODB_URI || 'mongodb://game:gameEA@147.83.7.155:27018/proyectoEA',
        USER: process.env.MONGODB_USER,
        PASSWORD: process.env.MONGODB_PASSWORD
    },
    apiURL: 'http://localhost:3000',
    jwtSecret: 'chulibobito',
    defaultImage: 'https://res.cloudinary.com/dyjz5e9a6/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1606479202/default%20images/default_ktlol4.png'
}