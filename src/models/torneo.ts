/* nombre, descripcion, url, responsable */
import mongoose, { Schema, Document} from 'mongoose';
import { IUser } from './user';

//Modelo de objeto que se guarda en la BBDD de MongoDB
let torneoSchema = mongoose.Schema;
const torneo = new torneoSchema({
    /* _id: {
        type: Schema.Types.ObjectId    
    }, */
    name: {
        type: String
    },
    admin: [{
        _id: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    players: [{
        _id: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }]
});

//Interfaz para tratar respuesta como documento
export interface ITorneo extends Document {
    /* _id: string; */
    name: string;
    admin: Array<IUser>
    players: Array<IUser>
    torneoToJson(): JSON;
}

torneo.methods.torneoToJSON = function(){
    return {
        name: this.name,
        admin : this.admin,
        players : this.players
    };
}

//Exportamos modelo para poder usarlo
export default mongoose.model<ITorneo>('Torneo', torneo);