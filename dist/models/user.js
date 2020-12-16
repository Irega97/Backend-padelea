"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/* nombre, descripcion, url, responsable */
const mongoose_1 = __importStar(require("mongoose"));
//Modelo de objeto que se guarda en la BBDD de MongoDB
let userSchema = mongoose_1.default.Schema;
const user = new userSchema({
    /* _id: {
        type: Schema.Types.ObjectId
    }, */
    name: {
        type: String
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    username: {
        type: String,
        //DEJAR ESTO COMENTADO HASTA QUE NO IMPLEMENTEMOS QUE EL USER PONGA USERNAME SI SE REGISTRA CON OAUTH
        unique: true
    },
    image: {
        type: String
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String
    },
    provider: {
        type: String
    },
    online: {
        type: Boolean
    },
    public: {
        type: Boolean
    },
    friends: [{
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            },
            status: {
                type: Number
                // 0 : Solicitud enviada
                // 1 : Solicitud recibida
                // 2 : Colegas
            }
        }],
    torneos: [{
            torneo: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Torneo'
            },
            statistics: {
                type: String
            }
        }],
    notifications: [
        {
            type: Object,
            ref: 'Notification'
        }
    ],
    chats: [{
            chat: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Chat'
            }
        }]
});
user.methods.userToJSON = function () {
    return {
        name: this.name,
        firstName: this.firstName,
        lastName: this.lastName,
        username: this.username,
        image: this.image,
        email: this.email,
        password: this.password,
        provider: this.provider,
        friends: this.friends,
        notifications: this.notifications,
        online: this.online,
        public: this.public,
        chat: this.chats
    };
};
//Exportamos modelo para poder usarlo
exports.default = mongoose_1.default.model('User', user);
