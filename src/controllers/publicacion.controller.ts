import { Request, Response } from "express";
import User, { IUser } from "../models/user"
import Publicacion from "../models/publicacion";

// Obtener publicaciones
// Hacer publicacion
// Dar mg y comentar una publi

async function getMyPublications(req: Request, res: Response){
    User.findOne({"_id": req.user}, {username: 1, publicaciones: 1}).then((data) => {
        return res.status(200).json(data);
    });
}

async function getHomePublications(req: Request, res: Response){
    let publicaciones: any = [];
    User.findOne({"_id": req.user}, {friends: 1}).populate({path: 'friends', populate: {path: 'user', select: 'publicaciones'}}).then((data) => {
        if(data==null) return res.status(404).json({message: "Friends not found"});
        data.friends.forEach((friend) => {
            console.log("friend: ", friend);
            if(friend.user.publicaciones != []){
                friend.user.publicaciones.forEach((publi: any) => {
                    publicaciones.push(publi);
                });
            }
        });
        return res.status(200).json(publicaciones);
    });
}

async function postPublication(req: Request, res: Response){
    let mensaje = req.body.mensaje;
    const publication = new Publicacion({
        user: req.user,
        mensaje: mensaje,
        likes: [],
        comments: [],
        date: Date.now()
    });
    User.updateOne({"_id": req.user}, {$addToSet: {publicaciones: publication}}).then((data) => {
        return res.status(200).json(data);
    })
}

async function addLike(req: Request, res: Response){
    const publiID = req.body.publicacion;
    const userID = req.body.user;
    User.findById(userID, {publicaciones: 1}).then(async (data) => {
        console.log(data);
        if(data==null) return res.status(404).json({message: "Publicaciones not found"});
        data.publicaciones.forEach((publi:any) => {
            if(publi._id.toString() == publiID.toString()){
                if(publi.likes.includes(req.user)){
                    publi.likes.splice(publi.likes.indexOf(req.user), 1);
                } else {
                    publi.likes.push(req.user);
                }
            }
        });
        console.log(data.publicaciones);
        await User.updateOne({"_id":userID}, {$set: {publicaciones: data.publicaciones}}).then((data) => {
            if(data.nModified != 1) return res.status(400).json({message: "Bad Request"});
            return res.status(200).json(data);
        });
    });
}

async function addComment(req: Request, res: Response){

}

export default { getMyPublications, postPublication, getHomePublications, addLike, addComment }