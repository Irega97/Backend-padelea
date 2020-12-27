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
function getUsers(req, res) {
    user_1.default.find({}, { username: 1, image: 1 }).then((data) => {
        if (data == null)
            return res.status(404).json({ message: "Users not found" });
        data.forEach((item) => {
            let i = data.indexOf(item);
            if (req.user == item.id)
                data.splice(i, 1);
        });
        return res.status(200).json(data);
    }).catch((err) => {
        console.log(err);
        return res.status(500).json(err);
    });
}
function getUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const me = yield user_1.default.findById(req.user, { friends: 1 });
        user_1.default.findOne({ "username": req.params.username }, { username: 1, image: 1, email: 1, online: 1, name: 1, friends: 1, torneos: 1 }).then((data) => {
            if (data == null)
                return res.status(404).json({ message: "User not found" });
            let friendStatus = -1;
            me === null || me === void 0 ? void 0 : me.friends.forEach((item) => {
                if (item.user == data.id) {
                    friendStatus = item.status;
                }
            });
            let dataToSend = {
                _id: data._id,
                username: data.username,
                image: data.image,
                email: data.email,
                name: data.name,
                friendStatus: friendStatus,
                numAmigos: data.friends.length,
                numTorneos: data.torneos.length
            };
            return res.status(200).json(dataToSend);
        }).catch((err) => {
            return res.status(500).json(err);
        });
    });
}
function getMyUser(req, res) {
    user_1.default.findById(req.user, { username: 1, name: 1, image: 1, email: 1, firstName: 1, lastName: 1, provider: 1, private: 1 }).then((data) => {
        let status = 200;
        if (data == null)
            status = 404;
        return res.status(status).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    });
}
function getMyNum(req, res) {
    user_1.default.findById(req.user, { friends: 1, torneos: 1 }).then(data => {
        let status = 200;
        const dataSend = {
            numAmigos: data === null || data === void 0 ? void 0 : data.friends.length,
            numTorneos: data === null || data === void 0 ? void 0 : data.torneos.length
        };
        return res.status(status).json(dataSend);
    }).catch((err) => {
        return res.status(500).json(err);
    });
}
function updateUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const id = req.user;
        let checkUsername = yield user_1.default.findOne({ "username": req.body.username });
        let checkEmail = yield user_1.default.findOne({ "email": req.body.email });
        if (checkUsername && (checkUsername === null || checkUsername === void 0 ? void 0 : checkUsername._id) != id)
            return res.status(409).json({ code: 409, message: "Username already exists" });
        else if (checkEmail && (checkEmail === null || checkEmail === void 0 ? void 0 : checkEmail._id) != id)
            return res.status(410).json({ code: 410, message: "Email already exists" });
        else {
            const name = req.body.name;
            const firstName = req.body.firstName;
            const lastName = req.body.lastName;
            const username = req.body.username;
            const email = req.body.email;
            if (req.body.password == "") {
                yield user_1.default.update({ "_id": id }, { $set: { "name": name, "firstName": firstName, "lastName": lastName, "username": username, "email": email,
                        "image": req.body.image, "private": req.body.private } }).then((data) => {
                    res.status(201).json(data);
                }).catch((err) => {
                    res.status(500).json(err);
                });
            }
            else {
                yield user_1.default.update({ "_id": id }, { $set: { "name": name, "firstName": firstName, "lastName": lastName, "username": username, "email": email,
                        "image": req.body.image, "password": req.body.password, "private": req.body.private } }).then((data) => {
                    res.status(201).json(data);
                }).catch((err) => {
                    res.status(500).json(err);
                });
            }
        }
    });
}
function deleteUser(req, res) {
    user_1.default.deleteOne({ "username": req.params.username }).then((data) => {
        res.status(200).json(data);
    }).catch((err) => {
        res.status(500).json(err);
    });
}
exports.default = { getUsers, getUser, updateUser, deleteUser, getMyUser, getMyNum };
