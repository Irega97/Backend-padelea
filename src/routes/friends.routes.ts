import {Router} from "express"; 
import friendsController from '../controllers/friends.controller'
import passport from 'passport';

//Router nos permite gestionar rutas de la API
const router = Router();

// FRIENDS ROUTES
router.get('/:username', passport.authenticate("jwt", {session: false}), friendsController.getFriends)
router.get('/me/all', passport.authenticate("jwt", {session: false}), friendsController.getMyFriends)
router.post('/:username', passport.authenticate("jwt", {session: false}), friendsController.addFriend);
router.post('/:username/status', passport.authenticate("jwt", {session: false}), friendsController.changeFriendStatus);
router.delete('/:username', passport.authenticate("jwt", {session: false}), friendsController.delFriend);

export default router;