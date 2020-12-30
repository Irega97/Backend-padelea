import mongoose, { Schema, Document} from 'mongoose';
import { IUser } from './user';
import { IMensaje} from './mensaje';

let chatSchema = mongoose.Schema;
const chat = new chatSchema({
    /*_id: {
        type: Schema.Types.ObjectId    
    },*/
    name: {
        type: String
    },
    image: {
        type: String
    },
    users: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    mensajes: [
        {
            type: Object,
            ref: 'Mensaje'
        }
    ],
});

export interface IChat extends Document {
    /*_id: string;*/
    name: string
    image: string
    users: Array<IUser>
    mensajes: Array<IMensaje>
    chatToJson(): JSON;
}

chat.methods.chatToJSON = function(){
    return {
        name: this.name,
        image: this.image,
        users: this.users,
        mensajes: this.mensajes
    };
}

export default mongoose.model<IChat>('Chat', chat);