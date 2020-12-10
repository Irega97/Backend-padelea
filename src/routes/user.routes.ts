import {Router} from "express"; 
import userController from '../controllers/user.controller'
import passport from 'passport';

//Router nos permite gestionar rutas de la API
const router = Router();

//Si no esta logeado, no le dejara ver los usuarios
router.get('/all', passport.authenticate("jwt", {session: false}), userController.getUsers);
router.get('/me', passport.authenticate("jwt", {session:false}), userController.getMyUser);
router.get('/:id', passport.authenticate("jwt", {session: false}), userController.getUser);
router.post('/me', passport.authenticate("jwt", {session: false}), userController.updateUser);
//router.post('/:id', userController.updateUser);
router.delete('/:id', passport.authenticate("jwt", {session: false}), userController.deleteUser);

router.post('/setusername/:username', passport.authenticate("jwt", { session: false }), userController.changeUsername);

// FRIENDS ROUTES
router.get('/:id/friends/all', passport.authenticate("jwt", {session: false}), userController.getFriends)
router.get('/me/friends/all', passport.authenticate("jwt", {session: false}), userController.getMyFriends)
router.post('/friends/:idfriend', passport.authenticate("jwt", {session: false}), userController.addFriend);
router.post('/friends/:idfriend/status', passport.authenticate("jwt", {session: false}), userController.changeFriendStatus);
router.delete('/friends/:idfriend', passport.authenticate("jwt", {session: false}), userController.delFriend);

//Exportamos router para usar rutas en app.ts
export default router;