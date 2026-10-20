import { Sequelize } from 'sequelize';
import { SQLITE_FILE } from 'src/env';

const db = new Sequelize({
    dialect: 'sqlite',
    storage: SQLITE_FILE,
    logging: (msg: string) => {
        if (msg.includes('DROP TABLE')) {
            throw new Error('DROP TABLE is strictly forbidden!');
        }
        console.log(`[SQL]: ${msg}`);
    }
});

export default db;
