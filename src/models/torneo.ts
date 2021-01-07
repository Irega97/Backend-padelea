/* nombre, descripcion, url, responsable */
import mongoose, { Schema, Document} from 'mongoose';

//Modelo de objeto que se guarda en la BBDD de MongoDB
let torneoSchema = mongoose.Schema;
const torneo = new torneoSchema({
    name: {
        type: String
    },
    type: { // Publico o privado
        type: String
    },
    description: {
        type: String
    },
    image: {
        type: String
    },
    fechaInicio: {
        type: Date
    },
    finInscripcion: {
        type: Date
    },
    ubicacion: {
        type: String
    },
    reglamento: { // FOTO
        type: String
    },
    numRondas: {
        type: Number
    },
    admin: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    maxPlayers: {
        type: Number
    },
    finalizado: {
        type: Boolean
    },
    players: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    cola: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    rondas: [{
        numero: {
            type: Number
        },
        fechaFin: {
            type: Date
        }
    }],
    previa: [{
        groupName: {
            type: String
        },
        classification: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }]
    }],
    grupos: [{
        groupName: {
            type: String
        },
        classification: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }]
    }]
});

//Interfaz para tratar respuesta como documento
export interface ITorneo extends Document {
    /* _id: string; */
    name: string;
    type: string;
    description: string;
    image: string;
    fechaInicio: Date;
    finInscripcion: Date;
    ubicacion: string;
    reglamento: string;
    numRondas: number;
    admin: Array<any>;
    maxPlayers: number;
    finalizado: boolean;
    players: Array<any>;
    cola: Array<any>;
    rondas: Array<any>;
    previa: Array<any>;
    grupos: Array<any>;
    torneoToJson(): JSON;
}

torneo.methods.torneoToJSON = function(){
    return {
        name: this.name,
        type: this.type,
        description: this.description,
        image: this.image,
        fechaInicio: this.fechaInicio,
        finInscripcion: this.finInscripcion,
        ubicacion: this.ubicacion,
        reglamento: this.reglamento,
        numRondas: this.numRondas,
        admin : this.admin,
        maxPlayers: this.maxPlayers,
        finalizado: this.finalizado,
        players : this.players,
        cola: this.cola,
        rondas: this.rondas,
        previa: this.previa,
        grupos: this.grupos
    };
}

//Exportamos modelo para poder usarlo
export default mongoose.model<ITorneo>('Torneo', torneo);