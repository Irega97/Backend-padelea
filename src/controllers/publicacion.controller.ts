import { Request, Response } from "express";
import User, { IUser } from "../models/user"
import Publicacion from "../models/publicacion";
import Comentario, { IComentario } from "../models/comentario";
import Torneo from "../models/torneo";

async function getPublicationsUser(req: Request, res: Response){
    User.findOne({"username": req.params.username}, {publicaciones: 1}).populate({path: 'publicaciones', populate: {path: 'user', select: 'username image'}}).then((data) => {
        console.log("Get mine: ", data);
        if(data == null) return res.status(404).json({message: "User not found"});
        if(data?.publicaciones.length > 1){
            data?.publicaciones.sort((a: any, b: any) => {
                if (a.date < b.date)
                return 1;
                
                else if (a.date > b.date)
                return -1;
        
                else
                return 0;
            });
        }  
        return res.status(200).json(data);
    });
}

async function getPublicationsTorneo(req: Request, res: Response){
    Torneo.findOne({"name": req.params.name}, {publicaciones: 1}).populate({path: 'publicaciones', populate: {path: 'torneo', select: 'name image'}}).then((data) => {
        if(data == null) return res.status(404).json({message: "Torneo not found"});
        if(data?.publicaciones.length > 1){
            data?.publicaciones.sort((a: any, b: any) => {
                if (a.date < b.date)
                return 1;
                
                else if (a.date > b.date)
                return -1;
        
                else
                return 0;
            });
        }  
        return res.status(200).json(data);
    });
}

async function getHomePublications(req: Request, res: Response){
    let publicaciones: any = [];
    console.log(req.user);
    User.findOne({"_id": req.user}, {friends: 1, torneos: 1, publicaciones: 1}).populate({path: 'friends', populate: {path: 'user', select: 'publicaciones',
     populate: {path: 'publicaciones', populate: {path: 'user', select: 'username image'}}}})
    .populate({path: 'publicaciones', populate: {path: 'user', select: 'username image'}})
    .populate({path: 'torneos', populate: {path: 'torneo', select: 'publicaciones', populate: {path: 'publicaciones', populate: {path: 'torneo', select: 'name image'}}}}).then(async (data) => {
        if(data==null) return res.status(404).json({message: "Friends not found"});
        
        await data.publicaciones.forEach((publi) => {
            publicaciones.push(publi);
        });
        await data.friends.forEach((friend) => {
            console.log("friend: ", friend);
            if(friend.user.publicaciones != []){
                friend.user.publicaciones.forEach((publi: any) => {
                    console.log("Publi: ", publi);
                    publicaciones.push(publi);
                });
            }
        });
        await data.torneos.forEach((torneo: any) => {
            if(torneo.torneo.publicaciones != []){
                torneo.torneo.publicaciones.forEach((publi: any) => {
                    publicaciones.push(publi);
                })
            }
        });

        if(publicaciones.length > 1){
            publicaciones.sort((a: any, b: any) => {
                if (a.date < b.date)
                return 1;
                
                else if (a.date > b.date)
                return -1;
        
                else
                return 0;
            });
        }        
        return res.status(200).json(publicaciones);
    });
}

async function postPublication(req: Request, res: Response){
    let mensaje = req.body.mensaje;
    let torneo = req.body.torneo;
    console.log("body: ", req.body);
    if(req.body.isTorneo == true){
        const publication = new Publicacion({
            type: 'torneo',
            torneo: torneo,
            mensaje: mensaje,
            likes: [],
            comments: [],
            date: Date.now()
        });
        publication.save().then((publi) => {
            Torneo.updateOne({"_id": torneo}, {$addToSet: {publicaciones: publi._id}}).then((data) => {
                if(data.nModified != 1) return res.status(400).json({message: "Bad request"});
                Publicacion.findById(publi._id).populate({path: 'torneo', select: 'name image'}).then((data) => {
                    if(data == null) return res.status(404).json({message: "Publication not found"});
                    return res.status(200).json(data);
                })
            })
        });
    } else {
        const publication = new Publicacion({
            type: 'user',
            user: req.user,
            mensaje: mensaje,
            likes: [],
            comments: [],
            date: Date.now()
        });
        publication.save().then((publi) => {
            User.updateOne({"_id": req.user}, {$addToSet: {publicaciones: publi._id}}).then((data) => {
                if(data.nModified != 1) return res.status(400).json({message: "Bad request"});
                Publicacion.findById(publi._id).populate({path: 'user', select: 'username image'}).then((data) => {
                    if(data == null) return res.status(404).json({message: "Publication not found"});
                    return res.status(200).json(data);
                })
            })
        });
    }
}

async function addLike(req: Request, res: Response){
    const publiID = req.body.publicacion;
    console.log("que esta pasando: ", publiID);
    Publicacion.findById(publiID).then((data: any) => {
        if(data.likes.includes(req.user)){
            data.likes.splice(data.likes.indexOf(req.user), 1);
        } else {
            data.likes.push(req.user);
        }
        Publicacion.updateOne({"_id": publiID}, {$set: {likes: data.likes}}).then((data) => {
            if(data.nModified != 1) return res.status(400).json({message: "Bad Request"});
            return res.status(200).json(data);
        })
    });
}

async function addComentario(req: Request, res: Response){ 
    const publiID = req.body.publicacion;
    const comentario = req.body.comentario;
    let comment = new Comentario({
        publicacion: publiID,
        date: Date.now(),
        user: req.user,
        comentario: comentario
    });

    comment.save().then((data) => {
        console.log("Comment: ", data);
        if(data == null) return res.status(400).json({message: "Error al añadir el comentario"});
        let commentID = data._id;
        Publicacion.updateOne({"_id": publiID}, {$addToSet: {comments: commentID}}).then((data) => {
            if(data.nModified != 1) return res.status(404).json({message: "Bad request"});
            return res.status(200).json(data);
        })
    });
}

async function getComentarios(req: Request, res: Response){
    const publiID = req.body.publicacion;
    console.log("comment: ", publiID);

    Publicacion.findOne({"_id": publiID}, {comments: 1}).populate({path: 'comments', populate: {path: 'user', select: 'username image'}}).then((data) => {
        if(data == null) return res.status(404).json({message: "Publicacion not found"});
        return res.status(200).json(data);
    });
}

export default { getPublicationsUser, postPublication, getHomePublications, addLike, addComentario, getComentarios, getPublicationsTorneo }