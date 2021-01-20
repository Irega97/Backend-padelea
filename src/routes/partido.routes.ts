import {Router} from "express"; 
import passport from "passport";
import partidoController from '../controllers/partido.controller'

//Router nos permite gestionar rutas de la API
const router = Router();

router.post('/new', passport.authenticate("jwt", {session: false}), partidoController.addPartido);
<<<<<<< HEAD
router.get('/:name/:vuelta/:grupo',  passport.authenticate("jwt", {session: false}), partidoController.getInfoGrupos);
=======
router.get('/:name/:vuelta/:grupo',  passport.authenticate("jwt", {session: false}), partidoController.getInfoGrupo);
>>>>>>> 0f2127069caa0f9c0c33aea4d40611190e3a918e
router.post('/results', passport.authenticate("jwt", {session: false}), partidoController.addResultados);

export default router;