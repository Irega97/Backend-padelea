import { IStatistics } from './statistics';
/* nombre, descripcion, url, responsable */
import mongoose, { Schema, Document} from 'mongoose';
import { IPartido } from './partido';
import { IPublicacion } from './publicacion';

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
    private: {
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
        torneo: {
            type: Schema.Types.ObjectId,
            ref: 'Torneo'
        },
        statistics: {
            type: Object,
            ref: 'Statistics'
        },
        status: {
            type: Number
            // 0 -> Esta en cola
            // 1 -> Esta inscrito
            // 2 -> Torneo finalizado
        }
    }],
    partidos: [{
        type: Schema.Types.ObjectId,
        ref: 'Partido'
    }],
    publicaciones: [{
        type: Schema.Types.ObjectId,
        ref: 'Publicacion'
    }],
    notifications: [
        {
            type: Object,
            ref: 'Notification'
        }
    ],
    chats: [{
        chat: {
            type: Schema.Types.ObjectId,
            ref: 'Chat'
        },
        ultimoleido: {
            type: Number
        }
    }],
    statistics: {
        type: Object,
        ref: 'Statistics'
    }

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
    private: boolean;
    friends: Array<any>;
    torneos: Array<any>;
    partidos: Array<IPartido>;
    publicaciones: Array<IPublicacion>;
    notifications: Array<any>;
    provider: string;
    chats: Array<any>;
    statistics: IStatistics;
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
        private: this.private,
        chat: this.chats,
        partidos: this.partidos,
        statistics: this.statistics
    };
}

//Exportamos modelo para poder usarlo
export default mongoose.model<IUser>('User', user);