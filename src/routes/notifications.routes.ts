import {Router} from "express"; 
import passport from "passport";
import notificationsController from '../controllers/notifications.controller'

//Router nos permite gestionar rutas de la API
const router = Router();

router.get('/me', passport.authenticate("jwt", {session: false}), notificationsController.getNotificationsMyUser);

export default router;