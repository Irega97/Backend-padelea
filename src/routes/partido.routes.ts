import {Router} from "express"; 
import passport from "passport";
import partidoController from '../controllers/partido.controller'

//Router nos permite gestionar rutas de la API
const router = Router();

router.post('/new', partidoController.addPartido);

/* router.put('/leave/:name', passport.authenticate("jwt", {session: false}), torneoController.leaveTorneo); */
export default router;