# backend/python/wallet/walletService.py
import os
import sys
import json
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from decimal import Decimal

# local import of razorpay wrapper
from razorpay_utils import create_order as rz_create_order 

# DB connect using env vars
PG_HOST = os.environ.get("PG_HOST", "localhost")
PG_PORT = int(os.environ.get("PG_PORT", 5432))
PG_DB = os.environ.get("PG_DB", "ibm_rideapp_capstone_db")
PG_USER = os.environ.get("PG_USER", "postgres")
PG_PASSWORD = os.environ.get("PG_PASSWORD", "Postgres@ibm25")

# Custom JSON encoder to handle Decimal and datetime objects
class CustomEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return super(CustomEncoder, self).default(o)

def get_conn():
    return psycopg2.connect(host=PG_HOST, port=PG_PORT, dbname=PG_DB, user=PG_USER, password=PG_PASSWORD)

# Utility helpers
def ensure_wallet_exists(conn, user_id):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM wallet WHERE user_id = %s", (user_id,))
    wallet = cur.fetchone()
    if not wallet:
        cur.execute("INSERT INTO wallet (user_id, balance) VALUES (%s, %s) RETURNING *", (user_id, 0.00))
        wallet = cur.fetchone()
        conn.commit()
    cur.close()
    return wallet

def add_wallet_transaction(conn, wallet_id, credit=None, debit=None, status="pending", razorpay_payment_id=None, note=None):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        INSERT INTO wallet_transaction (wallet_id, credit, debit, txn_date, status, razorpay_payment_id)
        VALUES (%s, %s, %s, CURRENT_TIMESTAMP, %s, %s) RETURNING *
    """, (wallet_id, credit, debit, status, razorpay_payment_id))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    return row

def cmd_credit(user_id, amount):
    conn = get_conn()
    try:
        wallet = ensure_wallet_exists(conn, user_id)
        # create razorpay order in paise
        order = rz_create_order(int(float(amount) * 100))
        # log transaction with pending status, store razorpay_payment_id
        txn = add_wallet_transaction(
            conn,
            wallet['wallet_id'],
            credit=amount,
            debit=None,
            status='pending',
            razorpay_payment_id=order['id']
        )
        return {"success": True, "order": order, "txn": txn}
    finally:
        conn.close()

def cmd_verify_and_capture(txn_id, razorpay_payment_id, razorpay_signature=None):
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM wallet_transaction WHERE transc_id = %s", (txn_id,))
        txn = cur.fetchone()
        if not txn:
            return {"success": False, "message": "Transaction not found"}

        if txn['status'] != 'pending':
            return {"success": False, "message": "Transaction not pending"}

        # Update wallet balance
        cur.execute(
            "UPDATE wallet SET balance = balance + %s, last_updated = CURRENT_TIMESTAMP WHERE wallet_id = %s",
            (txn['credit'], txn['wallet_id'])
        )
        cur.execute(
            "UPDATE wallet_transaction SET status='success', razorpay_payment_id=%s WHERE transc_id=%s",
            (razorpay_payment_id, txn_id)
        )
        conn.commit()
        return {"success": True, "message": "Wallet credited"}
    finally:
        conn.close()

def cmd_debit(user_id, amount, ride_id=None):
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM wallet WHERE user_id = %s", (user_id,))
        wallet = cur.fetchone()
        if not wallet:
            return {"success": False, "message": "Wallet not found for user"}

        if float(wallet['balance']) < float(amount):
            return {"success": False, "message": "Insufficient wallet balance"}

        txn = add_wallet_transaction(conn, wallet['wallet_id'], credit=None, debit=amount, status='success')
        cur.execute(
            "UPDATE wallet SET balance = balance - %s, last_updated = CURRENT_TIMESTAMP WHERE wallet_id = %s",
            (amount, wallet['wallet_id'])
        )
        conn.commit()
        return {"success": True, "message": f"Debited {amount} from wallet", "txn": txn}
    finally:
        conn.close()

def cmd_withdraw(user_id, amount, dest_details=None):
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM wallet WHERE user_id=%s", (user_id,))
        wallet = cur.fetchone()
        if not wallet:
            return {"success": False, "message": "Wallet not found"}
        if float(wallet['balance']) < float(amount):
            return {"success": False, "message": "Insufficient balance"}

        # Create pending debit transaction for withdrawal
        txn = add_wallet_transaction(conn, wallet['wallet_id'], credit=None, debit=amount, status='pending', razorpay_payment_id=None)
        return {"success": True, "message": "Withdrawal initiated", "txn": txn}
    finally:
        conn.close()

def usage():
    return {"success": False, "message": "usage: python walletService.py action [params]"}

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print(json.dumps(usage()))
        sys.exit(1)

    action = args[0]

    try:
        if action == "credit":
            user_id = int(args[1])
            amount = float(args[2])
            out = cmd_credit(user_id, amount)
        elif action == "verify":
            txn_id = int(args[1])
            rp_payment_id = args[2]
            out = cmd_verify_and_capture(txn_id, rp_payment_id)
        elif action == "debit":
            user_id = int(args[1])
            amount = float(args[2])
            ride_id = args[3] if len(args) > 3 else None
            out = cmd_debit(user_id, amount, ride_id)
        elif action == "withdraw":
            user_id = int(args[1])
            amount = float(args[2])
            out = cmd_withdraw(user_id, amount)
        else:
            out = usage()
    except Exception as e:
        out = {"success": False, "error": str(e)}

    print(json.dumps(out, cls=CustomEncoder))
