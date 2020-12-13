"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//Importamos dependencias
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
const cookieSession = require("cookie-session");
//Importamos fichero de rutas
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const friends_routes_1 = __importDefault(require("./routes/friends.routes"));
const torneo_routes_1 = __importDefault(require("./routes/torneo.routes"));
const notifications_routes_1 = __importDefault(require("./routes/notifications.routes"));
//Importamos middlewares
const passport_1 = __importDefault(require("passport"));
const passport_2 = __importDefault(require("./middlewares/passport"));
//Inicializamos express
const app = express_1.default();
//Configuración
//Cuando haya variable de entorno sera PORT y sino 3000
app.set('port', process.env.PORT || 3000);
//middlewares
app.use(morgan_1.default('dev'));
app.use(cors_1.default());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
app.use(passport_1.default.initialize());
passport_1.default.use(passport_2.default);
//Llama a las rutas de la API
app.use('/user', user_routes_1.default);
app.use('/auth', auth_routes_1.default);
app.use('/friends', friends_routes_1.default);
app.use('/torneo', torneo_routes_1.default);
app.use('/notifications', notifications_routes_1.default);
console.log("PREGUNTAR A CRISTIAN X EL COMPONENT DE IONIC: COMO HACER QUE REDIRIJA AL PULSAR OK CUANDO CADUCA LA SESION (interceptor)");
//Exportamos fichero como 'app'
exports.default = app;
