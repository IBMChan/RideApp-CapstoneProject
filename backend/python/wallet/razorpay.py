import os
import razorpay

KEY_ID = os.environ.get("RAZORPAY_KEY_ID")
KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET")

client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))

def create_order(amount_in_inr_paisa, currency="INR", receipt=None):
    # amount in paise
    payload = {"amount": int(amount_in_inr_paisa), "currency": currency, "receipt": receipt or "rcpt_"}
    return client.order.create(payload)
