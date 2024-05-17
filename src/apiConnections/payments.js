import { sendJsonPostRequest, sendGetRequest } from '@/baseFunctions/requests'

export function getPayments(startIndex = 0, limit = null) {
  let params = { start: startIndex }
  if (limit) params['size'] = limit

  return sendGetRequest('/payments', params)
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
