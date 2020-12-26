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
function getMyTorneos(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        user_1.default.findById(req.user, { select: { torneos: 1 } }).populate({ path: 'torneos', populate: { path: 'torneo', select: 'name' } }).then((data) => {
            if (data == null)
                return res.status(404).json({ message: "Torneos no encontrados" });
            return res.status(200).json(data);
        });
    });
}
function createTorneo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("body torneo: ", req.body);
        let name = req.body.name;
        let checkName = yield torneo_1.default.findOne({ "name": name });
        if (checkName)
            return res.status(409).json("Este torneo ya existe");
        let user = req.user;
        let type = req.body.type;
        let description = req.body.description;
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
            fechaInicio: fechaInicio,
            finInscripcion: finInscripcion,
            ubicacion: ubicacion,
            reglamento: reglamento,
            numRondas: numRondas,
            admin: [user],
            maxPlayers: maxPlayers,
            players: [user]
        });
        if (participa == false) {
            torneo.players = [];
        }
        console.log("torneo: ", torneo);
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
            console.log("hola");
            let t = yield torneo_1.default.findOne({ 'name': req.params.name });
            let inscriptionsPeriod;
            user_1.default.findById(req.user).then((data) => __awaiter(this, void 0, void 0, function* () {
                console.log("user: ", data);
                console.log("torneo: ", t);
                if (t != null) {
                    if (t.finInscripcion.valueOf() - Date.now() > 0) {
                        inscriptionsPeriod = true;
                    }
                    else
                        inscriptionsPeriod = false;
                    if ((t === null || t === void 0 ? void 0 : t.players.length) < (t === null || t === void 0 ? void 0 : t.maxPlayers) && inscriptionsPeriod && t.type == "public") {
                        yield torneo_1.default.updateOne({ "_id": t === null || t === void 0 ? void 0 : t._id }, { $addToSet: { players: data === null || data === void 0 ? void 0 : data.id } }).then(torneo => {
                            if (torneo.nModified != 1)
                                return res.status(400).json({ message: "Ya estás inscrito" });
                            t = torneo;
                        });
                        yield user_1.default.updateOne({ "_id": data === null || data === void 0 ? void 0 : data._id }, { $addToSet: { torneos: [{ torneo: t._id, statistics: null, status: 1 }] } }).then(user => {
                            if (user.nModified != 1)
                                return res.status(400).json({ message: "Ya estás inscrito" });
                        });
                        return res.status(200).json(t);
                    }
                    else {
                        yield torneo_1.default.updateOne({ "_id": t === null || t === void 0 ? void 0 : t._id }, { $addToSet: { cola: data === null || data === void 0 ? void 0 : data.id } }).then(torneo => {
                            if (torneo.nModified != 1)
                                return res.status(400).json({ message: "Ya estás inscrito" });
                            t = torneo;
                        });
                        yield user_1.default.updateOne({ "_id": data === null || data === void 0 ? void 0 : data._id }, { $addToSet: { torneos: [{ torneo: t._id, statistics: null, status: 0 }] } }).then(user => {
                            if (user.nModified != 1)
                                return res.status(400).json({ message: "Ya estás inscrito" });
                        });
                        return res.status(200).json(t);
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
exports.default = { getTorneo, getTorneos, getMyTorneos, createTorneo, joinTorneo };
