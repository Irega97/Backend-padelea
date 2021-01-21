import { ITorneo } from './torneo';
import mongoose, { Document, Schema} from 'mongoose';
import { IUser } from './user';

let partidoSchema = mongoose.Schema;
const partido = new partidoSchema({
    torneo: {
        idTorneo: {
            type: Schema.Types.ObjectId,
            ref: 'Torneo'
        },
        vuelta: {
            type: String
        },
        grupo: {
            type: String
        }
    },
    jugadores: {
        pareja1: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        pareja2: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    resultado: { // x - y  x->pareja1, y->pareja2
        set1: { //{set1: '6-4', set2: '2-6', set3: '3-6'}
            type: String
        },
        set2: {
            type: String
        },
        set3: {
            type: String
        }
    },
    ganadores: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
});

//Interfaz para tratar respuesta como documento
export interface IPartido extends Document {
    torneo: any;
    jugadores: any;
    resultado: any;
    ganadores: Array<IUser>;
    partidoToJson(): JSON;
}

partido.methods.partidoToJSON = function(){
    return {
        torneo: this.torneo,
        jugadores: this.jugadores,
        resultado: this.resultado,
        ganadores: this.ganadores
    };
}

//Exportamos modelo para poder usarlo
export default mongoose.model<IPartido>('Partido', partido);