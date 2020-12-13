import {Router} from "express"; 
import passport from "passport";
import notificationsController from '../controllers/notifications.controller'

//Router nos permite gestionar rutas de la API
const router = Router();

router.get('/all', passport.authenticate("jwt", {session: false}), notificationsController.getNotifications);

export default router;