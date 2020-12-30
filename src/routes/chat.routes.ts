import { Router } from "express"; 
import chatController from '../controllers/chat.controller'
import passport from 'passport';

//Router nos permite gestionar rutas de la API
const router = Router();

// FRIENDS ROUTES
router.get('/:id', passport.authenticate("jwt", {session: false}), chatController.getChat)
router.get('/me/all', passport.authenticate("jwt", {session: false}), chatController.getMyChats)
router.post('/new', passport.authenticate("jwt", {session: false}), chatController.addChat);
<<<<<<< HEAD
//router.post('/add/:id', passport.authenticate("jwt", {session: false}), chatController.addOtroParti);
=======
/* router.post('/add/:id', passport.authenticate("jwt", {session: false}), chatController.addOtroParti); */
>>>>>>> 741884d28708efa949a06179bcec78ddd3ea1696
router.delete('/:id', passport.authenticate("jwt", {session: false}), chatController.delChat);

export default router;