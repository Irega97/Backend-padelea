import {Router} from "express"; 
import userController from '../controllers/user.controller'
import passport from 'passport';

//Router nos permite gestionar rutas de la API
const router = Router();

//Si no esta logeado, no le dejara ver los usuarios
router.get('/all', passport.authenticate("jwt", {session: false}), userController.getUsers);

router.get('/:id', userController.getUser);
//router.post('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
/* router.post('/:id/friends/:idfriend', userController.addFriend);
router.delete('/:id/friends/:idfriend', userController.delFriend); */

//Exportamos router para usar rutas en app.ts
export default router;