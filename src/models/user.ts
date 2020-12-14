/* nombre, descripcion, url, responsable */
import mongoose, { Schema, Document} from 'mongoose';
import { IChat } from './chat';
import { INotification } from './notification';

//Modelo de objeto que se guarda en la BBDD de MongoDB

let userSchema = mongoose.Schema;
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
            type: Schema.Types.ObjectId,
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
        _id: {
            type: Schema.Types.ObjectId,
            ref: 'Torneo'
        }
    }],
    notifications: [{
        _id: {
            type: Object,
            ref: 'Notification'
        }
    }],

    chats: [{
        _id: {
            type: Schema.Types.ObjectId,
            ref: 'Chat'
        }
    }]

});

//Interfaz para tratar respuesta como documento
export interface IUser extends Document {
    /* _id: string; */
    name: string;
    firstName: string;
    lastName: string;
    username: string;
    image: string;
    email: string;
    password: string;
    online: boolean;
    public: boolean;
    friends: Array<any>;
    torneos: Array<any>;
    notifications: Array<any>;
    provider: string;
    chats: Array<any>;
    userToJson(): JSON;
}

user.methods.userToJSON = function(){
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
}

//Exportamos modelo para poder usarlo
export default mongoose.model<IUser>('User', user);