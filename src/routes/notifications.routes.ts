import {Router} from "express"; 
import passport from "passport";
import notificationsController from '../controllers/notifications.controller'

//Router nos permite gestionar rutas de la API
const router = Router();

router.post('/me', passport.authenticate("jwt", {session: false}), notificationsController.getMyNotifications);

export default router;