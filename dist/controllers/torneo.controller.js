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
        const torneoID = req.params.id;
        const userID = req.user;
        let joined = false;
        let isAdmin = false;
        torneo_1.default.findById(torneoID).populate({ path: 'players admin', populate: { path: 'user', select: 'name username image' } }).then((data) => {
            if (data == null)
                return res.status(404).json({ message: 'Torneo not found' });
            data.admin.forEach((admin) => {
                if (admin.user._id == userID)
                    isAdmin = true;
            });
            data.players.forEach((player) => {
                if (player.user._id == userID)
                    joined = true;
            });
            let dataToSend = {
                torneo: data,
                isAdmin: isAdmin,
                joined: joined
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
/*  name: this.name,
    description: this.description,
    rondas: this.rondas,
    duracionRondas: this.duracionRondas,
    ubicacion: this.ubicacion,
    reglamento: this.reglamento,
    admin : this.admin,
    players : this.players,
    cola: this.cola,
    previa: this.previa,
    grupos: this.grupos */
function createTorneo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let name = req.body.name;
        let admin = req.user;
        let torneo = new torneo_1.default({
            name: name,
            admin: [{ user: admin }],
            players: [{ user: admin }]
        });
        torneo.save().then((data) => {
            if (data == null)
                return res.status(500).json({ message: "Error" });
            user_1.default.updateOne({ "_id": req.user }, { $addToSet: { torneos: { torneo: torneo } } }).then(user => {
                if (user == null)
                    return res.status(500).json({ message: "Error" });
            }, error => {
                return res.status(500).json(error);
            });
            return res.status(201).json(data);
        });
    });
}
function joinTorneo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let t = yield torneo_1.default.findById(req.params.id);
            yield user_1.default.findById(req.user).then(data => {
                console.log("eo", data);
                user_1.default.updateOne({ "_id": req.user }, { $addToSet: { torneos: { torneo: t } } }).then(user => {
                    console.log("user: ", user);
                    if (user.nModified == 1) {
                        torneo_1.default.updateOne({ "_id": t === null || t === void 0 ? void 0 : t._id }, { $addToSet: { players: { user: data === null || data === void 0 ? void 0 : data.id } } }).then(torneo => {
                            console.log("torneo: ", torneo);
                            if (torneo.nModified == 1)
                                return res.status(200).json(torneo);
                            else
                                return res.status(400).json({ message: "Ya estás inscrito" });
                        });
                    }
                    else
                        return res.status(400).json({ message: "Ya estás inscrito" });
                });
            });
        }
        catch (error) {
            return res.status(500).json(error);
        }
    });
}
exports.default = { getTorneo, getTorneos, getMyTorneos, createTorneo, joinTorneo };
