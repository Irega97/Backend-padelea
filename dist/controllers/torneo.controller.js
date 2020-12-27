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
const torneo_1 = __importDefault(require("../models/torneo"));
const user_1 = __importDefault(require("../models/user"));
function getTorneo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const torneo = req.params.name;
        const userID = req.user;
        let joined = false;
        let isAdmin = false;
        let inscription = false;
        torneo_1.default.findOne({ 'name': torneo }).populate({ path: 'players admin', select: 'name username image' }).then((data) => {
            if (data == null)
                return res.status(404).json({ message: 'Torneo not found' });
            data.admin.forEach((admin) => {
                if (admin._id == userID)
                    isAdmin = true;
            });
            data.players.forEach((player) => {
                if (player._id == userID)
                    joined = true;
            });
            if (data.finInscripcion.valueOf() - Date.now() > 0)
                inscription = true;
            let dataToSend = {
                torneo: data,
                isAdmin: isAdmin,
                joined: joined,
                inscription: inscription
            };
            return res.status(200).json(dataToSend);
        }, (error) => {
            return res.status(500).json(error);
        });
    });
}
function getTorneos(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        torneo_1.default.find({}).then((data) => {
            if (data == null)
                return res.status(404).json({ message: 'Torneo not found' });
            return res.status(200).json(data);
        }, (error) => {
            return res.status(500).json(error);
        });
    });
}
function getTorneosUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        user_1.default.findOne({ "username": req.params.username }, 'torneos').populate({ path: 'torneos', populate: { path: 'torneo', select: 'name image' } }).then((data) => {
            console.log(data);
            if (data == null)
                return res.status(404).json({ message: 'Torneos not found' });
            data.torneos.forEach((torneo) => {
                if (torneo.status == 0)
                    data.torneos.splice(data.torneos.indexOf(torneo), 1);
            });
            return res.status(200).json(data);
        }, (error) => {
            return res.status(500).json(error);
        });
    });
}
function createTorneo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let name = req.body.name;
        let checkName = yield torneo_1.default.findOne({ "name": name });
        if (checkName)
            return res.status(409).json("Este torneo ya existe");
        let user = req.user;
        let type = req.body.type;
        let description = req.body.description;
        let image = 'https://res.cloudinary.com/dyjz5e9a6/image/upload/v1609083619/default%20images/la-red-en-el-padel_wyfchm.jpg';
        let fechaInicio = req.body.fechaInicio;
        let finInscripcion = req.body.finInscripcion;
        let ubicacion = req.body.ubicacion;
        let reglamento = req.body.reglamento;
        let numRondas = req.body.numRondas;
        let maxPlayers = req.body.maxPlayers;
        let participa = req.body.participa;
        let torneo = new torneo_1.default({
            name: name,
            type: type,
            description: description,
            image: image,
            fechaInicio: fechaInicio,
            finInscripcion: finInscripcion,
            ubicacion: ubicacion,
            reglamento: reglamento,
            numRondas: numRondas,
            admin: [user],
            maxPlayers: maxPlayers,
            finalizado: false,
            players: [user]
        });
        if (participa == false) {
            torneo.players = [];
        }
        torneo.save().then((data) => {
            if (participa == true) {
                user_1.default.updateOne({ "_id": req.user }, { $addToSet: { torneos: { torneo: data.id, statistics: null, status: 1 } } }).then(user => {
                    if (user == null)
                        return res.status(404).json({ message: "User not found" });
                }, (error) => {
                    console.log(error);
                    return res.status(500).json({ message: "Internal Server Error" });
                });
            }
            return res.status(201).json(data);
        }, (error) => {
            console.log(error);
            return res.status(500).json({ message: "Internal Server Error" });
        });
    });
}
function joinTorneo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let t = yield torneo_1.default.findOne({ 'name': req.params.name });
            let tID = t === null || t === void 0 ? void 0 : t.id;
            let inscriptionsPeriod;
            user_1.default.findById(req.user).then((data) => __awaiter(this, void 0, void 0, function* () {
                if (t != null) {
                    if (t.finInscripcion.valueOf() - Date.now() > 0) {
                        inscriptionsPeriod = true;
                    }
                    else
                        inscriptionsPeriod = false;
                    if ((t === null || t === void 0 ? void 0 : t.players.length) < (t === null || t === void 0 ? void 0 : t.maxPlayers) && inscriptionsPeriod && t.type != "private") {
                        yield torneo_1.default.updateOne({ "_id": t === null || t === void 0 ? void 0 : t._id }, { $addToSet: { players: data === null || data === void 0 ? void 0 : data.id } }).then(torneo => {
                            if (torneo.nModified != 1)
                                return res.status(400).json({ message: "Ya estás inscrito" });
                        });
                        yield user_1.default.updateOne({ "_id": data === null || data === void 0 ? void 0 : data._id }, { $addToSet: { torneos: [{ torneo: tID, statistics: null, status: 1 }] } }).then(user => {
                            if (user.nModified != 1)
                                return res.status(400).json({ message: "Ya estás inscrito" });
                        });
                        return res.status(200).json("Te has unido a " + (t === null || t === void 0 ? void 0 : t.name));
                    }
                    else {
                        let isPlayer = false;
                        t.players.forEach((player) => {
                            if (player == req.user)
                                isPlayer = true;
                        });
                        if (isPlayer)
                            return res.status(400).json({ message: "Ya estás inscrito" });
                        else {
                            yield torneo_1.default.updateOne({ "_id": t === null || t === void 0 ? void 0 : t._id }, { $addToSet: { cola: data === null || data === void 0 ? void 0 : data.id } }).then(torneo => {
                                if (torneo.nModified != 1)
                                    return res.status(400).json({ message: "Ya estás inscrito" });
                            });
                            yield user_1.default.updateOne({ "_id": data === null || data === void 0 ? void 0 : data._id }, { $addToSet: { torneos: [{ torneo: tID, statistics: null, status: 0 }] } }).then(user => {
                                if (user.nModified != 1)
                                    return res.status(400).json({ message: "Ya estás inscrito" });
                            });
                            return res.status(200).json("Has solicitado unirte a " + (t === null || t === void 0 ? void 0 : t.name));
                        }
                    }
                }
                else
                    return res.status(404).json({ message: "Torneo not found" });
            }));
        }
        catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    });
}
function leaveTorneo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        //TE DEJA IRTE SI ESTAS EN COLA O SI AUN NO HA EMPEZADO
        try {
            let t;
            let u;
            let status = -1;
            yield torneo_1.default.findOne({ "name": req.params.name }).then((data) => {
                if (data == null)
                    return res.status(404).json({ message: "Torneo not found" });
                else {
                    t = data;
                }
            });
            yield user_1.default.findById(req.user).then((data) => {
                if (data == null)
                    return res.status(404).json({ message: "User not found" });
                else {
                    data === null || data === void 0 ? void 0 : data.torneos.forEach((torneo) => {
                        if (torneo.torneo.toString() == (t === null || t === void 0 ? void 0 : t._id))
                            status = torneo.status;
                        console.log(status);
                    });
                    u = data;
                }
            });
            if (status == 0) { //COLA
                t === null || t === void 0 ? void 0 : t.cola.forEach((user) => {
                    if (user == req.user)
                        t === null || t === void 0 ? void 0 : t.cola.splice(t === null || t === void 0 ? void 0 : t.cola.indexOf(user), 1);
                });
                torneo_1.default.updateOne({ name: t === null || t === void 0 ? void 0 : t.name }, { $set: { cola: t === null || t === void 0 ? void 0 : t.cola } }).then((data) => {
                    if (data.nModified != 1)
                        return res.status(400).json({ message: "No has podido abandonar " + t.name });
                    u.torneos.forEach((torneo) => {
                        if (torneo.torneo == (t === null || t === void 0 ? void 0 : t.id)) {
                            u.torneos.splice(u.torneos.indexOf(torneo), 1);
                        }
                    });
                    user_1.default.updateOne({ "_id": req.user }, { $set: { torneos: u.torneos } }).then((data) => {
                        if (data.nModified != 1)
                            return res.status(400).json({ message: "No has podido abandonar " + t.name });
                        else
                            return res.status(200).json({ message: "Has abandonado " + (t === null || t === void 0 ? void 0 : t.name) });
                    });
                });
            }
            else if (status == 1 && t.fechaInicio - Date.now() > 0) { //PLAYER
                t === null || t === void 0 ? void 0 : t.players.forEach((user) => {
                    if (user == req.user)
                        t === null || t === void 0 ? void 0 : t.players.splice(t === null || t === void 0 ? void 0 : t.players.indexOf(user), 1);
                });
                torneo_1.default.updateOne({ name: t === null || t === void 0 ? void 0 : t.name }, { $set: { players: t === null || t === void 0 ? void 0 : t.players } }).then((data) => {
                    if (data.nModified != 1)
                        return res.status(400).json({ message: "No has podido abandonar " + t.name });
                    u.torneos.forEach((torneo) => {
                        if (torneo.torneo == (t === null || t === void 0 ? void 0 : t.id)) {
                            u.torneos.splice(u.torneos.indexOf(torneo), 1);
                        }
                    });
                    user_1.default.updateOne({ "_id": req.user }, { $set: { torneos: u.torneos } }).then((data) => {
                        if (data.nModified != 1)
                            return res.status(400).json({ message: "No has podido abandonar " + t.name });
                        else
                            return res.status(200).json({ message: "Has abandonado " + (t === null || t === void 0 ? void 0 : t.name) });
                    });
                });
            }
            else {
                return res.status(400).json({ message: "No estás en el torneo" });
            }
        }
        catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    });
}
exports.default = { getTorneo, getTorneos, getTorneosUser, createTorneo, joinTorneo, leaveTorneo };
