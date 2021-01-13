import { Router } from "express"; 
import chatController from '../controllers/chat.controller'
import passport from 'passport';

//Router nos permite gestionar rutas de la API
const router = Router();

// FRIENDS ROUTES
router.post('/get', passport.authenticate("jwt", {session: false}), chatController.getChat);
router.post('/addAdmin/:id', passport.authenticate("jwt", {session: false}), chatController.addAdmin);
router.post('/addParticipante/:id', passport.authenticate("jwt", {session: false}), chatController.addParticipante);
router.get('/me/all', passport.authenticate("jwt", {session: false}), chatController.getMyChats);
router.get('/me', passport.authenticate("jwt", {session: false}), chatController.getChatsSinLeer);
router.post('/new', passport.authenticate("jwt", {session: false}), chatController.addChat);
router.post('/message/:id', passport.authenticate("jwt", {session: false}), chatController.sendMessage);
//router.delete('/:id', passport.authenticate("jwt", {session: false}), chatController.delChat);

export default router;