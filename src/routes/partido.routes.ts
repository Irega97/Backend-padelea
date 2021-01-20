import {Router} from "express"; 
import passport from "passport";
import partidoController from '../controllers/partido.controller'

//Router nos permite gestionar rutas de la API
const router = Router();

router.post('/new', passport.authenticate("jwt", {session: false}), partidoController.addPartido);
router.get('/:name/:vuelta/:grupo',  passport.authenticate("jwt", {session: false}), partidoController.getPartidosGrupo);
router.post('/results', passport.authenticate("jwt", {session: false}), partidoController.addResultados);

export default router;