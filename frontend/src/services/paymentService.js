import apiClient from './apiClient';

export const paymentService = {
  async getPaymentMethods() {
    const res = await apiClient.get('/payments/methods/');
    return res.data;
  },

  async initiatePayment(paymentData) {
    const res = await apiClient.post('/payments/initiate/', paymentData);
    return res.data;
  },

  async verifyPayment(transactionRef) {
    const res = await apiClient.post(`/payments/verify/${transactionRef}/`);
    return res.data;
  },

  async simulatePaymentSuccess(transactionRef) {
    const res = await apiClient.post(`/payments/simulate-success/${transactionRef}/`);
    return res.data;
  },
};

export default paymentService;
