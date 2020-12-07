/* nombre, descripcion, url, responsable */
import mongoose, { Schema, Document} from 'mongoose';

//Modelo de objeto que se guarda en la BBDD de MongoDB
let userSchema = mongoose.Schema;
const user = new userSchema({
    _id: {
        type: String    
    },
    name: {
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
    friends: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
});

//Interfaz para tratar respuesta como documento
export interface IUser extends Document {
    _id: string;
    name: string;
    username: string;
    image: string;
    email: string;
    password: string;
    online: boolean;
    friends: IUser['_id'];
    provider: string;
    userToJson(): JSON;
}

user.methods.userToJSON = function(){
    return {
        name: this.name,
        username: this.username,
        image: this.image,
        email: this.email,
        password: this.password,
        provider: this.provider,
        friends: this.friends,
        online: this.online
    };
}

//Exportamos modelo para poder usarlo
export default mongoose.model<IUser>('User', user);