import apiClient from './apiClient';

export const shippingService = {
  async getShippingOptions() {
    const res = await apiClient.get('/shipping/options/');
    return res.data;
  },

  async calculateFee(city, deliveryMethod, subtotal) {
    const res = await apiClient.post('/shipping/calculate-fee/', {
      city,
      delivery_method: deliveryMethod,
      subtotal,
    });
    return res.data;
  },
};

export default shippingService;
