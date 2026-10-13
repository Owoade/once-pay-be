import { DataTypes, ModelAttributes, Model, ModelCtor } from 'sequelize';

const schema_type = {
    primary_key(){
        return {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        }
    },
    string(){
        return {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    int(default_value?: any){
        return {
            type: DataTypes.INTEGER,
            allowNull: false,
            ...(default_value !== undefined && { defaultValue: default_value })
        }
    },
    bigint(default_value?: any){
        return {
            type: DataTypes.BIGINT,
            allowNull: false,
            ...(default_value !== undefined && { defaultValue: default_value })
        }
    },
    decimal(precision: number, scale: number){
        return {
            type: DataTypes.DECIMAL(precision, scale),
            allowNull: false
        }
    },
    boolean(){
        return {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    },
    date(){
        return {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    text(){
        return {
            type: DataTypes.TEXT,
            allowNull: false
        }
    },
    optional(typeFn: () => any){
        return {
            ...typeFn(),
            allowNull: true
        }
        
    },
    unique(typeFn: () => any){
        return {
            ...typeFn(),
            unique: true
        }
    },
};

export type InferedSchemaType<T extends {} > =  ModelCtor<Model<T>>

export default schema_type;
