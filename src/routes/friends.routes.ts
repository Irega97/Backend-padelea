import {Router} from "express"; 
import friendsController from '../controllers/friends.controller'
import passport from 'passport';

//Router nos permite gestionar rutas de la API
const router = Router();

// FRIENDS ROUTES
router.get('/:id', passport.authenticate("jwt", {session: false}), friendsController.getFriends)
router.get('/me/all', passport.authenticate("jwt", {session: false}), friendsController.getMyFriends)
router.post('/:idfriend', passport.authenticate("jwt", {session: false}), friendsController.addFriend);
router.post('/:idfriend/status', passport.authenticate("jwt", {session: false}), friendsController.changeFriendStatus);
router.delete('/:idfriend', passport.authenticate("jwt", {session: false}), friendsController.delFriend);

export default router;