import {Router} from "express";
import passport from "passport";
import publicacionController from '../controllers/publicacion.controller'; 

const router = Router();

router.post('/new', passport.authenticate("jwt", {session: false}), publicacionController.postPublication);
router.get('/me', passport.authenticate("jwt", {session: false}), publicacionController.getMyPublications);
router.get('/all', passport.authenticate("jwt", {session: false}), publicacionController.getHomePublications);
router.post('/like', passport.authenticate("jwt", {session: false}), publicacionController.addLike);
router.post('/comment', passport.authenticate("jwt", {session: false}), publicacionController.addComentario);
router.get('/comments/all', passport.authenticate("jwt", {session: false}), publicacionController.getComentarios);

export default router;