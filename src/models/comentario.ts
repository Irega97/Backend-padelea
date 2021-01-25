import mongoose, { Schema, Document} from 'mongoose';
import { IUser } from './user';
import { IPublicacion } from './publicacion';

let comentarioSchema = mongoose.Schema;
const comentario = new comentarioSchema({
    publicacion: {
        type: Schema.Types.ObjectId,
        ref: 'Publicacion'
    },
    date :{
        type: Date,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    comentario: {
        type: String
    }
});

export interface IComentario extends Document {
    publicacion: IPublicacion;
    date: Date;
    user: IUser;
    comentario: string;
    mensajeToJson(): JSON;
}

comentario.methods.comentarioToJson = function(){
    return {
        publicacion : this.publicacion,
        date : this.date,
        user: this.user,
        comentario: this.comentario
    };
}

export default mongoose.model<IComentario>('Comentario', comentario);