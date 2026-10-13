import { Sequelize } from 'sequelize';

const db = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: (msg: string) => {
        if (msg.includes('DROP TABLE')) {
            throw new Error('DROP TABLE is strictly forbidden!');
        }
        console.log(`[SQL]: ${msg}`);
    }
});

export default db;
