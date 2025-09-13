import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ibm_rideapp_capstone_db',
    password: 'your_password',
    port: 5432,
});

export const walletRepository = {
    async getWalletByUserId(user_id) {
        const res = await pool.query('SELECT * FROM wallet WHERE user_id = $1', [user_id]);
        return res.rows[0];
    },

    async createWallet(user_id) {
        const res = await pool.query(
            'INSERT INTO wallet(user_id) VALUES($1) RETURNING *',
            [user_id]
        );
        return res.rows[0];
    },

    async updateBalance(wallet_id, balance) {
        const res = await pool.query(
            'UPDATE wallet SET balance=$1, last_updated=NOW() WHERE wallet_id=$2 RETURNING *',
            [balance, wallet_id]
        );
        return res.rows[0];
    }
};
