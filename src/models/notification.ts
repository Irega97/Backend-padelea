import mongoose, { Document} from 'mongoose';

//Modelo de objeto que se guarda en la BBDD de MongoDB
let notificationSchema = mongoose.Schema;
const notification = new notificationSchema({
    /* _id: {
        type: Schema.Types.ObjectId    
    }, */
    type: {
        type: String
    },
    description: {
        type: String
    },
    status: {
        type: Number
    },
    origen: {
        type: String
    },
    image: {
        type: String
    }
});

//Interfaz para tratar respuesta como documento
export interface INotification extends Document {
    /* _id: string; */
    type: String;
    description: String;
    status: Number;
    origen: String;
    image: String;
    notificationToJson(): JSON;
}

notification.methods.notificationToJSON = function(){
    return {
        type: this.type,
        description: this.description,
        status: this.status,
        origen: this.origen,
        image: this.image
    };
}

//Exportamos modelo para poder usarlo
export default mongoose.model<INotification>('Notification', notification);
