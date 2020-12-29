import {Router} from "express"; 
import adminController from '../controllers/admin.controller'

// Router nos permite gestionar rutas de la API
const router = Router();

router.get('/:name/cola', adminController.getColaPlayers);
router.post('/:name/cola', adminController.acceptPlayers);


// Exportamos router para usar rutas en app.ts
export default router;