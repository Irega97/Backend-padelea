import {Router} from "express"; 
import userController from '../controllers/user.controller'

//Router nos permite gestionar rutas de la API
const router = Router();

router.get('/all', userController.getUsers);
router.get('/:id', userController.getUser);
//router.post('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
/* router.post('/:id/friends/:idfriend', userController.addFriend);
router.delete('/:id/friends/:idfriend', userController.delFriend); */

//Exportamos router para usar rutas en app.ts
export default router;