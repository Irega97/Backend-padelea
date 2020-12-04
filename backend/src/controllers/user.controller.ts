import { Request, Response } from "express";
import User from "../models/user";
import passport from 'passport';

function getUsers(req:Request, res:Response): void {
    User.find({}).then((data)=>{
        let status: number = 200;
        if(data==null) status = 404;
        return res.status(status).json(data);
    }).catch((err) => {
        console.log(err);
        return res.status(500).json(err);
    })
}

function getUser(req:Request, res:Response): void {
    User.findById(req.params.id).populate('friends').then((data)=>{
        let status: number = 200;
        if(data==null) status = 404;
        return res.status(status).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    })
}

/* function postUserDemo (req: Request, res: Response): void {
    const user = new User({
        "nombre": req.body.nombre,
        "apellidos": req.body.apellidos,
        "edad": req.body.edad,
        "correo": req.body.correo,
        "telefono": req.body.telefono,
        "grado": req.body.grado,
        "courses": req.body.courses
    });
    console.log("El nombre es",req.body.nombre);
    console.log(req.body);
    user.save().then((data) => {
        return res.status(201).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    })
} */

/* function updateUser (req: Request, res: Response){
    const id: string = req.params.id;
    const nombre: string = req.body.nombre;
    const apellidos: string = req.body.apellidos;
    const edad: number = req.body.edad;
    const correo: string = req.body.correo;
    const telefono: number = req.body.telefono;
    const grado: string = req.body.grado;
    const courses: string = req.body.courses;
    User.update({"_id": id}, {$set: {"nombre": nombre, "apellidos": apellidos, "edad": edad, 
                              "correo": correo, "telefono": telefono, "grado": grado, "courses": courses}}).then((data) => {
        res.status(201).json(data);
    }).catch((err) => {
        res.status(500).json(err);
    })
} */

function deleteUser (req:Request,res:Response){
    User.deleteOne({"_id":req.params.id}).then((data) => {
        res.status(200).json(data);
    }).catch((err) => {
        res.status(500).json(err);
    })
}

function changeUsername (req:Request, res:Response){
    /* const user = req.user;
    const newUsername = req.params.username;
    User.update({"_id": user._id}, {$set: {"nombre": nombre, "apellidos": apellidos, "edad": edad, 
                              "correo": correo, "telefono": telefono, "grado": grado, "courses": courses}}).then((data) => {
        res.status(201).json(data);
    }).catch((err) => {
        res.status(500).json(err);
    })
    return res.status(200).json(req.body); */
}

export default { getUsers, getUser, /* postUserDemo, updateUser, */ deleteUser, changeUsername };