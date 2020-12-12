import {Router} from "express"; 
import authController from '../controllers/auth.controller'

// Router nos permite gestionar rutas de la API
const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.put('/signout', authController.signout);
router.get('/checkemail/:email', authController.checkemail);

// Exportamos router para usar rutas en app.ts
export default router;