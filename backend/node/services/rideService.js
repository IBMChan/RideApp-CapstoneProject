//laxmikanth: notification(email(smtp) - phone (firebase))
//prathik - ride handling , matching cpp - create / accept/ cancel ride , distance/fare - python
//payment(paypal) and rating functionalities(r_to_d, d_to_r) //collabrate with payment and rating services

import * as paymentService from './paymentService.js';
import * as userRepo from '../repositories/mysql/userRepository.js';
import * as ridesRepo from '../repositories/mysql/ridesRepository.js';
import * as paymentRepo from '../repositories/mongodb/paymentRepository.js';

/**
 * Create topup order via razorpay
 */
export async function createTopupOrder(user_id, amount) {
  // amount expected in INR rupees. Razorpay expects amount in paise.
  const paise = Math.round(Number(amount) * 100);
  const order = await paymentService.createRazorpayOrder({ amount: paise, currency: 'INR', receipt: `topup_${user_id}_${Date.now()}` });
  return order;
}

/**
 * Confirm topup: verify signature via python and then credit user wallet
 */
export async function confirmTopup({ user_id, amount, razorpay_payment_id, razorpay_order_id, razorpay_signature }) {
  // Verify signature
  const ok = await paymentService.verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
  if (!ok) throw new Error('Invalid payment signature');

  // persist payment record to mongo
  const paymentDoc = await paymentRepo.insertPayment({
    ride_id: null,
    fare: Number(amount),
    payment_id: razorpay_payment_id,
    order_id: razorpay_order_id,
    status: 'success',
    mode: 'card' // since topup via card/upi; you might want to pass actual mode from client
  });

  // update user wallet in MySQL
  await userRepo.incrementWallet(user_id, Number(amount));

  return { ok: true, credited: Number(amount), payment: paymentDoc };
}

/**
 * Pay for ride - supports wallet and other methods.
 */
export async function payRide({ ride_id, payer_id, mode, amount }) {
  // lookup ride to get driver id
  const ride = await ridesRepo.getRideById(ride_id);
  if (!ride) throw new Error('ride not found');

  const fare = amount ?? Number(ride.fare);
  if (mode === 'wallet') {
    // deduct from rider wallet and credit driver wallet
    const user = await userRepo.getUserById(payer_id);
    if (!user) throw new Error('payer not found');

    if (Number(user.wallet_balance) < Number(fare)) throw new Error('insufficient wallet balance');

    // transaction: deduct rider wallet, credit driver wallet, insert payment
    await userRepo.decrementWallet(payer_id, Number(fare));
    await userRepo.incrementWallet(ride.driver_id, Number(fare));
    // add to driver's earnings
    await userRepo.incrementEarnings(ride.driver_id, Number(fare));

    const paymentDoc = await paymentRepo.insertPayment({
      ride_id,
      fare: Number(fare),
      payment_id: `wallet_${Date.now()}`,
      order_id: null,
      status: 'success',
      mode: 'wallet'
    });

    // update ride status and mark completed
    await ridesRepo.updateRideStatus(ride_id, 'completed');

    return { ok: true, payment: paymentDoc };
  } else if (mode === 'cash') {
    // For cash: create a payment record showing pending/failed? mark ride completed client side.
    const paymentDoc = await paymentRepo.insertPayment({
      ride_id,
      fare: Number(fare),
      payment_id: null,
      order_id: null,
      status: 'pending',
      mode: 'cash'
    });
    await ridesRepo.updateRideStatus(ride_id, 'completed');
    return { ok: true, payment: paymentDoc, message: 'Marked ride completed; collect cash from rider' };
  } else {
    // UPI or card — create razorpay order and return order details for frontend to complete
    const paise = Math.round(Number(fare) * 100);
    const order = await paymentService.createRazorpayOrder({ amount: paise, currency: 'INR', receipt: `ride_${ride_id}_${Date.now()}` });
    // store a pending payment record
    await paymentRepo.insertPayment({
      ride_id,
      fare: Number(fare),
      payment_id: null,
      order_id: order.id,
      status: 'pending',
      mode
    });
    return { ok: true, order };
  }
}

/**
 * Generate ride QR — create a small QR representing a payment link or order payload
 * Returns { qr_image_data_url, order } (order if Razorpay order created)
 */
import QRCode from 'qrcode';
export async function generateRidePaymentQR(rideId) {
  const ride = await ridesRepo.getRideById(rideId);
  if (!ride) throw new Error('ride not found');

  const amount = ride.fare;
  // create a razorpay order for the fare (for payer to scan & pay)
  const paise = Math.round(Number(amount) * 100);
  const order = await paymentService.createRazorpayOrder({ amount: paise, currency: 'INR', receipt: `ride_qr_${rideId}_${Date.now()}` });

  // qr payload could be a small JSON with order id and rideId; frontend can render it as QR
  const payload = JSON.stringify({ type: 'ride_payment', ride_id: rideId, order_id: order.id, amount });
  const dataUrl = await QRCode.toDataURL(payload);

  // store pending payment doc
  await (await import('../repositories/mongodb/paymentRepository.js')).insertPayment({
    ride_id: rideId,
    fare: Number(amount),
    payment_id: null,
    order_id: order.id,
    status: 'pending',
    mode: 'upi' // expected via razorpay
  });

  return { qr: dataUrl, order };
}

/**
 * Handle webhook simple wrapper
 */
export async function handleWebhook({ payload, headers }) {
  // Optionally forward payload to paymentService for signature verification
  // For now just return ok
  return { ok: true, payload };
}
