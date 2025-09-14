import os
import razorpay

KEY_ID = "rzp_test_RHUCZ5IRQt5aBC"
KEY_SECRET = "u2M8oLtxU1WEjmDFVW0p3o9L"

# RAZORPAY_KEY_ID=rzp_test_RHUCZ5IRQt5aBC
# RAZORPAY_KEY_SECRET=u2M8oLtxU1WEjmDFVW0p3o9L

client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))

def create_order(amount_in_inr_paisa, currency="INR", receipt=None):
    # amount in paise
    payload = {"amount": int(amount_in_inr_paisa), "currency": currency, "receipt": receipt or "rcpt_"}
    return client.order.create(payload)
