import {Router} from "express"; 
import passport from "passport";
import torneoController from '../controllers/torneo.controller'

//Router nos permite gestionar rutas de la API
const router = Router();

router.get('/all', passport.authenticate("jwt", {session: false}), torneoController.getTorneos);
router.get('/all/:username', passport.authenticate("jwt", {session: false}), torneoController.getTorneosUser);
router.get('/:name', passport.authenticate("jwt", {session: false}), torneoController.getTorneo);

router.post('/new', passport.authenticate("jwt", {session: false}), torneoController.createTorneo);

router.post('/join/:name', passport.authenticate("jwt", {session: false}), torneoController.joinTorneo);
router.put('/leave/:name', passport.authenticate("jwt", {session: false}), torneoController.leaveTorneo);

export default router;