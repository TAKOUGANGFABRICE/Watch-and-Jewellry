import apiClient from './apiClient';

export const authService = {
  async register(data) {
    const res = await apiClient.post('/auth/register/', data);
    if (res.data?.tokens) {
      localStorage.setItem('farel_access_token', res.data.tokens.access);
      localStorage.setItem('farel_refresh_token', res.data.tokens.refresh);
      localStorage.setItem('farel_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async login(identifier, password) {
    const res = await apiClient.post('/auth/login/', { identifier, password });
    if (res.data?.tokens) {
      localStorage.setItem('farel_access_token', res.data.tokens.access);
      localStorage.setItem('farel_refresh_token', res.data.tokens.refresh);
      localStorage.setItem('farel_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async logout() {
    const refresh = localStorage.getItem('farel_refresh_token');
    try {
      if (refresh) {
        await apiClient.post('/auth/logout/', { refresh });
      }
    } catch (e) {
      console.warn("Logout notification error:", e);
    } finally {
      localStorage.removeItem('farel_access_token');
      localStorage.removeItem('farel_refresh_token');
      localStorage.removeItem('farel_user');
      window.dispatchEvent(new Event('farel_auth_logout'));
    }
  },

  async getProfile() {
    const res = await apiClient.get('/auth/profile/');
    return res.data;
  },

  async updateProfile(data) {
    const res = await apiClient.patch('/auth/profile/', data);
    if (res.data?.user) {
      localStorage.setItem('farel_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async changePassword(oldPassword, newPassword, newPasswordConfirm) {
    const res = await apiClient.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
    return res.data;
  },

  async requestPasswordReset(identifier) {
    const res = await apiClient.post('/auth/password-reset/request/', { identifier });
    return res.data;
  },

  async confirmPasswordReset(uidb64, token, newPassword, newPasswordConfirm) {
    const res = await apiClient.post('/auth/password-reset/confirm/', {
      uidb64,
      token,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
    return res.data;
  },

  async getAddresses() {
    const res = await apiClient.get('/auth/addresses/');
    return res.data.results ? res.data.results : res.data;
  },

  async createAddress(addressData) {
    const res = await apiClient.post('/auth/addresses/', addressData);
    return res.data;
  },

  async updateAddress(id, addressData) {
    const res = await apiClient.patch(`/auth/addresses/${id}/`, addressData);
    return res.data;
  },

  async deleteAddress(id) {
    const res = await apiClient.delete(`/auth/addresses/${id}/`);
    return res.data;
  },

  async setDefaultAddress(id) {
    const res = await apiClient.post(`/auth/addresses/${id}/set-default/`);
    return res.data;
  },

  async getAccountStatus() {
    const res = await apiClient.get('/auth/status/');
    return res.data;
  },
};

export default authService;
