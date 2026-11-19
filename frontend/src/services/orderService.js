import apiClient from './apiClient';

export const orderService = {
  async createCheckout(checkoutData) {
    const res = await apiClient.post('/orders/checkout/', checkoutData);
    return res.data;
  },

  async trackOrder(orderNumber) {
    const res = await apiClient.get(`/orders/tracking/${orderNumber}/`);
    return res.data;
  },

  async getMyOrders() {
    const res = await apiClient.get('/orders/my-orders/');
    return res.data.results ? res.data.results : res.data;
  },

  async getMyOrderDetail(orderNumber) {
    const res = await apiClient.get(`/orders/my-orders/${orderNumber}/`);
    return res.data;
  },
};

export default orderService;
