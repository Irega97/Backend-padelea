import mongoose, { Schema, Document} from 'mongoose';
import { IUser } from './user';
import { IComentario} from './comentario';

let publicacionSchema = mongoose.Schema;
const publicacion = new publicacionSchema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User Torneo'
    },
    /* torneo: {
        type: Schema.Types.ObjectId,
        ref: 'Torneo'
    }, */
    mensaje: {
        type: String    
    },
    date: {
        type: Date,
    },
    likes : [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        type: Schema.Types.ObjectId,
        ref: 'Comentario'
    }]
});

export interface IPublicacion extends Document {
    user: Array<IUser>;
    mensaje: string;
    date: Date;
    likes: Array<IUser>;
    comments: Array<IComentario>;
    publicacionToJson(): JSON;
}

publicacion.methods.publicacionToJSON = function(){
    return {
        user: this.user,
        mensaje: this.mensaje,
        date: this.date,
        likes: this.likes,
        comments: this.comments
    };
}

export default mongoose.model<IPublicacion>('Publicacion', publicacion);