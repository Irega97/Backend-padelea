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
    fechaInicio: {
        type: Date
    },
    inscripcion: {
        duracion: {
            type: Date
        },
        isOpen: {
            type: Boolean
        }
    },
    ubicacion: {
        type: String
    },
    reglamento: { // FOTO
        type: String
    },
    admin: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    players: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    cola: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
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
            member: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            position: {
                type: Number
            }
        }]
    }],
    grupos: [{
        groupName: {
            type: String
        },
        classification: [{
            member: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            position: {
                type: Number
            }
        }]
    }]
});

//Interfaz para tratar respuesta como documento
export interface ITorneo extends Document {
    /* _id: string; */
    name: string;
    description: string;
    rondas: number;
    duracionRondas: number;
    ubicacion: string;
    reglamento: string;
    admin: Array<any>;
    players: Array<any>;
    cola: Array<any>;
    previa: Array<any>;
    grupos: Array<any>;
    torneoToJson(): JSON;
}

torneo.methods.torneoToJSON = function(){
    return {
        name: this.name,
        description: this.description,
        rondas: this.rondas,
        duracionRondas: this.duracionRondas,
        ubicacion: this.ubicacion,
        reglamento: this.reglamento,
        admin : this.admin,
        players : this.players,
        cola: this.cola,
        previa: this.previa,
        grupos: this.grupos
    };
}

//Exportamos modelo para poder usarlo
export default mongoose.model<ITorneo>('Torneo', torneo);