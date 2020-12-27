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
const notifications_controller_1 = __importDefault(require("./notifications.controller"));
function getFriends(req, res) {
    user_1.default.findOne({ username: req.params.username }, { friends: 1 }).populate({ path: 'friends', populate: { path: 'user', select: 'username image' } }).then((data) => {
        if (data == null)
            return res.status(404).json();
        data.friends.forEach(friend => {
            if (friend.status != 2) {
                let i = data.friends.indexOf(friend);
                data.friends.splice(i, 1);
            }
        });
        return res.status(200).json(data);
    }).catch((err) => {
        return res.status(500).json(err);
    });
}
function addFriend(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const myID = req.user;
        let myUser;
        yield user_1.default.findById(myID).then((data) => {
            myUser = data === null || data === void 0 ? void 0 : data.username;
        });
        let receptorID;
        yield user_1.default.findOne({ username: req.params.username }).then((data) => {
            receptorID = data === null || data === void 0 ? void 0 : data._id;
        });
        let friend1 = {
            user: receptorID,
            status: 0
        };
        let friend2 = {
            user: req.user,
            status: 1
        };
        user_1.default.findById(myID).then(data => {
            const image = data === null || data === void 0 ? void 0 : data.image;
            if (!(data === null || data === void 0 ? void 0 : data.friends.includes(friend2.user))) {
                try {
                    user_1.default.findOneAndUpdate({ "_id": myID }, { $addToSet: { friends: friend1 } }).then(() => {
                        user_1.default.findOneAndUpdate({ "_id": receptorID }, { $addToSet: { friends: friend2 } }).then(() => {
                            notifications_controller_1.default.addNotification("Amigos", req.params.username + " quiere ser tu amigo", 1, req.params.username, myUser, image).then(data => {
                                if (data.nModified == 1) {
                                    return res.status(200).json({ message: "Amigo añadido correctamente" });
                                }
                                else if (data.nModified == 0) {
                                    return res.status(200).json({ message: "Error al guardar la notificacion" });
                                }
                                else {
                                    return res.status(500).json(data);
                                }
                            });
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
    return __awaiter(this, void 0, void 0, function* () {
        const accept = req.body.accept;
        const myID = req.user;
        yield user_1.default.findById(myID, { username: 1, friends: 1, image: 1 }).populate({ path: 'friends', populate: { path: 'user', select: 'username' } }).then((data) => {
            let myUser = data === null || data === void 0 ? void 0 : data.username;
            let myImage = data === null || data === void 0 ? void 0 : data.image;
            data === null || data === void 0 ? void 0 : data.friends.forEach((friend) => {
                if (friend.user.username == req.params.username) {
                    if (accept == true) {
                        friend.status = 2;
                        notifications_controller_1.default.addNotification("Amigos", myUser + " te ha aceptado como amigo", 1, req.params.username, myUser, myImage).then(null, error => {
                            return res.status(500).json(error);
                        });
                    }
                    else {
                        let i = data.friends.indexOf(friend);
                        data.friends.splice(i, 1);
                    }
                }
            });
            notifications_controller_1.default.deleteNotification("Amigos", myID, req.params.username).then(null, error => {
                return res.status(500).json(error);
            });
            user_1.default.updateOne({ "_id": myID }, { $set: { friends: data === null || data === void 0 ? void 0 : data.friends } }).then(null, error => {
                return res.status(500).json(error);
            });
        });
        yield user_1.default.findOne({ username: req.params.username }, { friends: 1 }).then((data) => {
            let friendID = data === null || data === void 0 ? void 0 : data.id;
            data === null || data === void 0 ? void 0 : data.friends.forEach((friend) => {
                if (friend.user == myID) {
                    if (accept === true) {
                        friend.status = 2;
                    }
                    else {
                        let i = data.friends.indexOf(friend);
                        data.friends.splice(i, 1);
                    }
                }
            });
            user_1.default.updateOne({ "_id": friendID }, { $set: { friends: data === null || data === void 0 ? void 0 : data.friends } }).then(null, error => {
                return res.status(500).json(error);
            });
        });
        return res.status(200).json({ message: "Succesfully updated" });
    });
}
function delFriend(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const myID = req.user;
        const username = req.params.username;
        let friendID;
        yield user_1.default.findById(myID, { friends: 1 }).populate({ path: 'friends', populate: { path: 'user', select: 'username' } }).then((data) => {
            data === null || data === void 0 ? void 0 : data.friends.forEach((friend) => {
                if (friend.user.username == username && friend.status == 2) {
                    data.friends.splice(data.friends.indexOf(friendID), 1);
                }
            });
            user_1.default.updateOne({ "_id": myID }, { $set: { friends: data === null || data === void 0 ? void 0 : data.friends } }).then(null, error => {
                return res.status(500).json(error);
            });
        });
        yield user_1.default.findOne({ username: username }, { friends: 1 }).then((data) => {
            data === null || data === void 0 ? void 0 : data.friends.forEach((friend) => {
                if (friend.user == myID && friend.status == 2) {
                    data.friends.splice(data.friends.indexOf(friendID), 1);
                }
            });
            user_1.default.updateOne({ "username": username }, { $set: { friends: data === null || data === void 0 ? void 0 : data.friends } }).then(null, error => {
                return res.status(500).json(error);
            });
        });
        return res.status(200).json();
    });
}
exports.default = { getFriends, addFriend, changeFriendStatus, delFriend };
