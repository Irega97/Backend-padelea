import mongoose, { Schema, Document} from 'mongoose';

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

export default mongoose.model<IMensaje>('Mensaje', mensaje);