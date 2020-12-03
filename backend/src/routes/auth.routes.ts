import {Router} from "express"; 
import authController from '../controllers/auth.controller'
import passport from 'passport';

// Router nos permite gestionar rutas de la API
const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.put('/signout', authController.signout);
router.get('/google', passport.authenticate("google", { scope: ["profile", "email", "openID"] }))
router.get("/google/redirect", passport.authenticate('google'));

// Exportamos router para usar rutas en app.ts
export default router;