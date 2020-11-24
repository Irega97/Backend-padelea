/* nombre, descripcion, url, responsable */
import mongoose, { Schema, Document} from 'mongoose';
import jwt from 'jsonwebtoken';

//Modelo de objeto que se guarda en la BBDD de MongoDB
let userSchema = mongoose.Schema;
const user = new userSchema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    sex: {
        type: String
    },
    image: { //URL DE LA IMAGEN????
        type: String
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
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
    name: string;
    sex: string;
    image: string;
    email: string;
    password: string;
    online: boolean;
    friends: IUser['_id'];
    userToJson(): JSON;
}

user.methods.userToJSON = function(){
    return {
        name: this.name,
        sex: this.sex,
        image: this.image,
        email: this.email,
        password: this.password,
        friends: this.friends
    };
}

//Exportamos modelo para poder usarlo
export default mongoose.model<IUser>('User', user);