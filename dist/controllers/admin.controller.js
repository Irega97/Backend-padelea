"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("../models/user"));
const torneo_1 = __importDefault(require("../models/torneo"));
function getColaPlayers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            torneo_1.default.findOne({ 'name': req.params.name }, { cola: 1 }).populate({ path: 'cola', select: 'username name image' }).then((data) => {
                if (data == null)
                    return res.status(404).json({ message: "Cola not found" });
                return res.status(200).json(data);
            });
        }
        catch (err) {
            console.log(err);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    });
}
function acceptPlayers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let user = req.body.user;
            let accept = req.body.accept;
            let userID;
            let torneoID;
            let message;
            const io = require('../sockets/socket').getSocket();
            yield torneo_1.default.findOne({ 'name': req.params.name }, { maxPlayers: 1, players: 1, cola: 1 }).populate({ path: 'cola', select: 'username' }).then((data) => {
                torneoID = data === null || data === void 0 ? void 0 : data.id;
                data === null || data === void 0 ? void 0 : data.cola.forEach((p) => {
                    if (p.username == user) {
                        userID = p._id;
                        data.cola.splice(data.cola.indexOf(p), 1);
                        if (accept == true)
                            data === null || data === void 0 ? void 0 : data.players.push(userID);
                    }
                });
                torneo_1.default.findOneAndUpdate({ 'name': req.params.name }, { $set: { players: data === null || data === void 0 ? void 0 : data.players, cola: data === null || data === void 0 ? void 0 : data.cola } }).then((d) => {
                    if (d == null)
                        return res.status(400).json({ message: "Bad request" });
                    else {
                        user_1.default.findById(userID, { select: { torneos: 1 } }).populate('torneos').then((user) => {
                            if (user == null)
                                return res.status(404).json({ message: "User not found" });
                            user === null || user === void 0 ? void 0 : user.torneos.forEach((t) => {
                                if (t.torneo == torneoID)
                                    if (accept == true)
                                        t.status = 1;
                                    else
                                        user.torneos.splice(user.torneos.indexOf(t), 1);
                            });
                            user_1.default.update({ "_id": userID }, { $set: { torneos: user === null || user === void 0 ? void 0 : user.torneos } }).then((d) => {
                                if (d.nModified != 1)
                                    return res.status(400).json({ message: "Bad request" });
                                if (accept == true) {
                                    message = "Usuario aceptado";
                                    let playerToSend = {
                                        torneo: req.params.name,
                                        username: d.username,
                                        name: d.name,
                                        image: d.image
                                    };
                                    io.emit('nuevoJugador', playerToSend);
                                    let newNotification = {
                                        type: "Torneo",
                                        description: "Has sido aceptado en " + req.params.name,
                                        status: 1,
                                        origen: req.params.name,
                                    };
                                    user_1.default.updateOne({ "_id": userID }, { $addToSet: { notifications: newNotification } }).then(data => {
                                        if (data.nModified == 1) {
                                            io.to(userID).emit('nuevaNotificacion', newNotification);
                                        }
                                        else if (data.nModified == 0) {
                                            return res.status(200).json({ message: "Error al guardar la notificacion" });
                                        }
                                    });
                                }
                                else {
                                    message = "Usuario rechazado";
                                    io.emit('nuevoJugador', null);
                                }
                                return res.status(200).json({ message: message });
                            });
                        });
                    }
                });
            });
        }
        catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    });
}
exports.default = { getColaPlayers, acceptPlayers };
