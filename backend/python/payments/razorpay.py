#!/usr/bin/env python3
import sys
import json
import os
import razorpay

RAZORPAY_KEY = os.environ.get('RAZORPAY_KEY')
RAZORPAY_SECRET = os.environ.get('RAZORPAY_SECRET')

client = razorpay.Client(auth=(RAZORPAY_KEY, RAZORPAY_SECRET))

def create_order(data):
    order = client.order.create({
        'amount': int(float(data['amount']) * 100),  # amount in paise
        'currency': data.get('currency', 'INR'),
        'receipt': f"r_{data['user_id']}"
    })
    return {'success': True, 'order': order}

def payout(data):
    # For simplicity, just simulate payout
    return {'success': True, 'message': f"Payout of {data['amount']} successful"}

if __name__ == "__main__":
    input_data = json.loads(sys.argv[1])
    action = input_data.get('action')

    if action == 'create_order':
        result = create_order(input_data)
    elif action == 'payout':
        result = payout(input_data)
    else:
        result = {'success': False, 'message': 'Unknown action'}

    print(json.dumps(result))
