//Importamos dependencias
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from'body-parser';
const cookieSession = require("cookie-session");

//Importamos fichero de rutas
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import friendsRoutes from './routes/friends.routes';
import torneoRoutes from './routes/torneo.routes'

//Importamos middlewares
import passport from 'passport';
import passportMiddleware from './middlewares/passport';

//Inicializamos express
const app = express();

//Configuración
//Cuando haya variable de entorno sera PORT y sino 3000
app.set('port', process.env.PORT || 3000);

//middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(bodyParser.json());
app.use(passport.initialize());
passport.use(passportMiddleware);

//Llama a las rutas de la API
app.use('/user', userRoutes);
app.use('/auth', authRoutes);
app.use('/friends', friendsRoutes);
app.use('/torneo', torneoRoutes);

console.log("PREGUNTAR A CRISTIAN X EL COMPONENT DE IONIC: COMO HACER QUE REDIRIJA AL PULSAR OK CUANDO CADUCA LA SESION (interceptor)")

//Exportamos fichero como 'app'
export default app;