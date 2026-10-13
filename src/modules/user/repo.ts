import { user_model } from './model.js';
import UserModelInterface from './type.js';

class UserRepo {
    constructor() {}

    async create(payload: UserModelInterface) {
        return (await user_model.create(payload))?.toJSON();
    }

    async find(filter: Partial<UserModelInterface> ): Promise<UserModelInterface>
    async find<T extends keyof UserModelInterface>( filter: Partial<UserModelInterface>, attributes: T[] ): Promise<Pick<UserModelInterface, T>>
    async find<T extends keyof UserModelInterface>(filter: Partial<UserModelInterface>, attributes?: T[]) {
        const user = await user_model.findOne({ where: filter, ...( attributes ? { attributes }: {}) });

        if( attributes ) return user?.toJSON() as Pick<UserModelInterface, T>;

        else return user?.toJSON() as UserModelInterface;
    }

    async update(filter: Partial<UserModelInterface>, payload: Partial<UserModelInterface>) {
        return await user_model.update(payload, { where: filter });
    }

}

const user_repo = new UserRepo();
export default user_repo;