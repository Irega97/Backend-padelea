import mongoose, { Schema, Document} from 'mongoose';
import { IUser } from './user';

let mensajeSchema = mongoose.Schema;
const mensaje = new mensajeSchema({
    /* _id: {
        type: Schema.Types.ObjectId    
    }, */
    body: {
        type: String,
    },
    date :{
        type: Date,
    },
    sender: {
        type: String
    },
    leido: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
});

export interface IMensaje extends Document {
    /* _id: string; */
    body: string
    date: Date
    sender: string
    leido: Array<IUser>
    mensajeToJson(): JSON;
}

mensaje.methods.mensajeToJSON = function(){
    return {
        body : this.body,
        date : this.date,
        sender: this.sender,
        leido: this.leido
    };
}

export default mongoose.model<IMensaje>('Mensaje', mensaje);