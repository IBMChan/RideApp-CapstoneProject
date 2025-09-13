import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ibm_rideapp_capstone_db',
    password: 'your_password',
    port: 5432,
});

export const walletTransactionRepository = {
    async addTransaction(wallet_id, credit = null, debit = null) {
        const res = await pool.query(
            'INSERT INTO wallet_transaction(wallet_id, credit, debit) VALUES($1, $2, $3) RETURNING *',
            [wallet_id, credit, debit]
        );
        return res.rows[0];
    }
};
