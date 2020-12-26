import {Router} from "express"; 
import userController from '../controllers/user.controller'
import passport from 'passport';

//Router nos permite gestionar rutas de la API
const router = Router();

//Si no esta logeado, no le dejara ver los usuarios
router.get('/all', passport.authenticate("jwt", {session: false}), userController.getUsers);
router.get('/me', passport.authenticate("jwt", {session:false}), userController.getMyUser);
router.get('/:username', passport.authenticate("jwt", {session: false}), userController.getUser);
router.post('/me', passport.authenticate("jwt", {session: false}), userController.updateUser);
//router.post('/:id', userController.updateUser);
router.delete('/:username', passport.authenticate("jwt", {session: false}), userController.deleteUser);

//Exportamos router para usar rutas en app.ts
export default router;