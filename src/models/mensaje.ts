/* nombre, descripcion, url, responsable */
import mongoose, { Schema, Document} from 'mongoose';
import { IUser } from './user';

//Modelo de objeto que se guarda en la BBDD de MongoDB
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
    }

});

//Interfaz para tratar respuesta como documento
export interface IMensaje extends Document {
    /* _id: string; */
    body: string
    date: Date
    mensajeToJson(): JSON;
}

mensaje.methods.mensajeToJSON = function(){
    return {
        body : this.body,
        date : this.date
    };
}

//Exportamos modelo para poder usarlo
export default mongoose.model<IMensaje>('Mensaje', mensaje);