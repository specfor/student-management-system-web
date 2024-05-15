import { sendJsonPostRequest, sendGetRequest } from '@/baseFunctions/requests'

export function getPayments() {
  return sendGetRequest('/payments')
}

export function createPayment(enrollmentId, amount) {
  return sendJsonPostRequest('/payments/' + enrollmentId, {
    payment_method: 'cash',
    amount: amount
    // payment_for: "2024-04-29"
  })
}

export function refundPayment(paymentId, reason) {
  return sendJsonPostRequest(`/payments/refund/${paymentId}`, {
    reason: reason
  })
}
