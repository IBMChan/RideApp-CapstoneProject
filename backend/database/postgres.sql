--saved_loc table ----

--wallet--
CREATE TABLE wallet (
    wallet_id BIGSERIAL PRIMARY KEY,          -- auto-incrementing wallet ID
    user_id INT NOT NULL,                       -- value provided by backend
    pin INT NOT NULL
    balance NUMERIC(12,2) DEFAULT 0.00 CHECK (balance >= 0),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


---wallet_transaction---
CREATE TABLE wallet_transaction (
    transc_id SERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL,               -- must match wallet.wallet_id
    credit NUMERIC(12,2),
    debit NUMERIC(12,2),
    txn_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Either credit or debit must be non-null
    CONSTRAINT chk_credit_or_debit CHECK (
        credit IS NOT NULL OR debit IS NOT NULL
    ),

    -- Only one of credit or debit can be non-null
    CONSTRAINT chk_only_one CHECK (
        NOT (credit IS NOT NULL AND debit IS NOT NULL)
    )
);
