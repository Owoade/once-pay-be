    
import db from '@db/index.js';
import { USER_TABLE_NAME, UserSchema } from '@db/schema/user.js';
import UserModelInterface from './type';
import type { InferedSchemaType } from '@utils/schema_type.js';

export const user_model = db.define(USER_TABLE_NAME, UserSchema, { timestamps: true }) as InferedSchemaType<UserModelInterface>;