import {Router} from "express"; 
import passport from "passport";
import torneoController from '../controllers/torneo.controller'

//Router nos permite gestionar rutas de la API
const router = Router();

router.get('/all', passport.authenticate("jwt", {session: false}), torneoController.getTorneos);
router.get('/all/me', passport.authenticate("jwt", {session: false}), torneoController.getMyTorneos);
router.get('/:name', passport.authenticate("jwt", {session: false}), torneoController.getTorneo);

router.post('/new', passport.authenticate("jwt", {session: false}), torneoController.createTorneo);
router.post('/join/:name', passport.authenticate("jwt", {session: false}), torneoController.joinTorneo);

export default router;