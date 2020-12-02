/* nombre, descripcion, url, responsable */
import mongoose, { Schema, Document} from 'mongoose';
import jwt from 'jsonwebtoken';

//Modelo de objeto que se guarda en la BBDD de MongoDB
let userSchema = mongoose.Schema;
const user = new userSchema({
    name: {
        type: String,
        unique: true
        //required: true
    },
    sex: {
        type: String
    },
    image: { 
        type: String
    },
    city: {
        type: String
    },
    email: {
        type: String,
        unique: true
        //required: true
    },
    password: {
        type: String
        //required: true
    },
    online: {
        type: Boolean
    },
    friends: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    googleId: {
        type: String
    }
});

//Interfaz para tratar respuesta como documento
export interface IUser extends Document {
    name: string;
    sex: string;
    image: string;
    city: string;
    email: string;
    password: string;
    online: boolean;
    friends: IUser['_id'];
    userToJson(): JSON;
    googleId: string;
}

user.methods.userToJSON = function(){
    return {
        name: this.name,
        sex: this.sex,
        image: this.image,
        city: this.city,
        email: this.email,
        password: this.password,
        friends: this.friends,
        googleId: this.googleId
    };
}

//Exportamos modelo para poder usarlo
export default mongoose.model<IUser>('User', user);