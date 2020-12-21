import mongoose, { Schema, Document} from 'mongoose';
import { IUser } from './user';
import { IMensaje} from './mensaje';

let chatSchema = mongoose.Schema;
const chat = new chatSchema({
    /*_id: {
        type: Schema.Types.ObjectId    
    },*/
    users: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    mensajes: [{
        mensaje: {
            type: Schema.Types.ObjectId,
            ref: 'Mensaje'
        }
    }]
});

export interface IChat extends Document {
    /*_id: string;*/
    users: Array<IUser>
    mensajes: Array<IMensaje>
    chatToJson(): JSON;
}

chat.methods.chatToJSON = function(){
    return {
        users : this.users,
        mensajes : this.mensajes
    };
}

export default mongoose.model<IChat>('Chat', chat);