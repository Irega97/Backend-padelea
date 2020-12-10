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
//EN LOS GETS DEVOLVER SOLO LO NECESARIO 
function getUsers(req, res) {
    user_1.default.find({}, { username: 1, image: 1, friends: 1 }).then((data) => {
        let status = 200;
        if (data == null)
            status = 404;
        console.log("micky tontito", data);
        return res.status(status).json(data);
    }).catch((err) => {
        console.log(err);
        return res.status(500).json(err);
    });
}
function getUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let me = yield user_1.default.findById(req.user, { friends: 1 });
        user_1.default.findById(req.params.id, { username: 1, image: 1, email: 1 }).then((data) => {
            if (data == null)
                return res.status(404).json({ message: "User not found" });
            console.log("micky tontito2", data);
            let friendStatus = -1;
            me === null || me === void 0 ? void 0 : me.friends.forEach((item) => {
                console.log(item);
                if (item.user == req.params.id) {
                    friendStatus = item.status;
                }
            });
            let dataToSend = {
                username: data.username,
                image: data.image,
                email: data.email,
                friendStatus: friendStatus
            };
            return res.status(200).json(dataToSend);
        }).catch((err) => {
            return res.status(500).json(err);
        });
    });
}
function getMyUser(req, res) {
    user_1.default.findById(req.user, { username: 1, name: 1, image: 1, email: 1, firstName: 1, lastName: 1, provider: 1 }).then((data) => {
        let status = 200;
        if (data == null)
            status = 404;
        return res.status(status).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    });
}
//ESTO ESTA HECHO PARA HACERLO EN DOS RUTAS; NO HACE FALTA ENVIAR TODO EN EL AddFriends();
function getFriends(req, res) {
    user_1.default.findById(req.params.id, { friends: 1 }).then((data) => {
        let status = 200;
        if (data == null)
            status = 404;
        return res.status(status).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    });
}
function getMyFriends(req, res) {
    user_1.default.findById(req.user, { friends: 1 }).then((data) => {
        let status = 200;
        if (data == null)
            status = 404;
        return res.status(status).json(data);
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
                        "image": req.body.image, "public": req.body.public } }).then((data) => {
                    res.status(201).json(data);
                }).catch((err) => {
                    res.status(500).json(err);
                });
            }
            else {
                yield user_1.default.update({ "_id": id }, { $set: { "name": name, "firstName": firstName, "lastName": lastName, "username": username, "email": email,
                        "image": req.body.image, "password": req.body.password, "public": req.body.public } }).then((data) => {
                    res.status(201).json(data);
                }).catch((err) => {
                    res.status(500).json(err);
                });
            }
        }
    });
}
function deleteUser(req, res) {
    user_1.default.deleteOne({ "_id": req.params.id }).then((data) => {
        res.status(200).json(data);
    }).catch((err) => {
        res.status(500).json(err);
    });
}
function changeUsername(req, res) {
    const userID = req.user;
    const newUsername = req.params.username;
    user_1.default.findById({ "_id": userID }).then((data) => {
        user_1.default.update({ "_id": userID }, { $set: { "name": data === null || data === void 0 ? void 0 : data.name, "username": newUsername, "image": data === null || data === void 0 ? void 0 : data.image, "email": data === null || data === void 0 ? void 0 : data.email,
                "password": data === null || data === void 0 ? void 0 : data.password, "provider": data === null || data === void 0 ? void 0 : data.provider, "friends": data === null || data === void 0 ? void 0 : data.friends, "online": data === null || data === void 0 ? void 0 : data.online, "public": data === null || data === void 0 ? void 0 : data.public } })
            .then((data) => {
            return res.status(201).json(data);
        }).catch((err) => {
            return res.status(500).json(err);
        });
    });
}
//DUDAS FRIENDS
/*
-> Porque no nos lee el include y nos los añade más de una vez si hacemos la peticion again?
-> Porque el changeStatus nos da 200 OK pero no actualiza los datos?
*/
//PULSAR EL BOTON SI NO SOIS AMIGOS
function addFriend(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const myID = req.user;
        const receptorID = req.params.idfriend;
        let friend1 = {
            user: receptorID,
            status: 0
        };
        let friend2 = {
            user: req.user,
            status: 1
        };
        console.log("friends: ", friend1, friend2);
        user_1.default.findById(myID).then(data => {
            if (!(data === null || data === void 0 ? void 0 : data.friends.includes(friend1.user))) {
                try {
                    user_1.default.findOneAndUpdate({ "_id": myID }, { $addToSet: { friends: friend1 } }).then(() => {
                        user_1.default.findOneAndUpdate({ "_id": receptorID }, { $addToSet: { friends: friend2 } }).then(() => {
                            return res.status(200).json({ message: "Amigo añadido correctamente" });
                        });
                    });
                }
                catch (err) {
                    return res.status(500).json(err);
                }
            }
            else {
                return res.status(401).json({ message: "Solicitud ya enviada" });
            }
        });
    });
}
function changeFriendStatus(req, res) {
    const myID = req.user;
    const friendID = req.params.idfriend;
    let friend1 = {
        user: friendID,
        status: 1
    };
    let friend2 = {
        user: req.user,
        status: 0
    };
    console.log("friends: ", friend1, friend2);
    user_1.default.findById(myID).then(data => {
        if (!(data === null || data === void 0 ? void 0 : data.friends.includes(friend1))) {
            try {
                user_1.default.findOneAndUpdate({ "_id": myID }, { $set: { "friends.$[status].value": 2 } }, { arrayFilters: [friend1] }).then(() => {
                    user_1.default.findOneAndUpdate({ "_id": friendID }, { $set: { "friends.$.[status].value": 2 } }, { arrayFilters: [friend2] }).then(() => {
                        return res.status(200).json();
                    });
                });
            }
            catch (err) {
                return res.status(500).json(err);
            }
        }
        else {
            return res.status(401).json({ message: "Solicitud ya enviada" });
        }
    });
}
function delFriend(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const myID = req.user;
        const friendID = req.params.idfriend;
        let friend1 = {
            user: friendID,
            status: 2
        };
        let friend2 = {
            user: req.user,
            status: 2
        };
        console.log("friends: ", friend1, friend2);
        try {
            user_1.default.findOneAndUpdate({ "_id": myID }, { $pull: { friends: friend1 } }).then(data => {
                console.log("1. ", data);
            });
            user_1.default.findOneAndUpdate({ "_id": friendID }, { $pull: { friends: friend2 } }).then(d => {
                console.log("2. ", d);
            });
            return res.status(200).json();
        }
        catch (err) {
            return res.status(500).json(err);
        }
    });
}
exports.default = { getUsers, getUser, updateUser, deleteUser, changeUsername, getMyUser, addFriend, changeFriendStatus, delFriend, getFriends, getMyFriends };
