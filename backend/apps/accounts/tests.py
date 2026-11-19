from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User, Address


class AccountAuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="nicolas.song@farel.cm",
            phone="+237691234567",
            password="FarelPassword2026!",
            first_name="Nicolas",
            last_name="Song",
        )

    def test_customer_registration_success(self):
        payload = {
            'first_name': "Samuel",
            'last_name': "Eto",
            'email': "samuel.eto@farel.cm",
            'phone': "+237 690 12 34 56",
            'password': "LuxuryPassword2026!",
            'password_confirm': "LuxuryPassword2026!",
            'preferred_city': "Douala",
        }
        response = self.client.post('/api/v1/auth/register/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
        self.assertEqual(response.data['user']['email'], "samuel.eto@farel.cm")

    def test_customer_registration_invalid_cameroon_phone(self):
        payload = {
            'first_name': "Invalide",
            'last_name': "Numero",
            'email': "invalide@farel.cm",
            'phone': "+33 6 12 34 56 78",  # French number, not Cameroon
            'password': "LuxuryPassword2026!",
            'password_confirm': "LuxuryPassword2026!",
        }
        response = self.client.post('/api/v1/auth/register/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        has_phone_error = 'phone' in response.data or ('errors' in response.data and 'phone' in response.data['errors'])
        self.assertTrue(has_phone_error)

    def test_customer_login_with_email(self):
        payload = {
            'identifier': "nicolas.song@farel.cm",
            'password': "FarelPassword2026!",
        }
        response = self.client.post('/api/v1/auth/login/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertEqual(response.data['user']['email'], "nicolas.song@farel.cm")

    def test_customer_login_with_cameroon_phone(self):
        payload = {
            'identifier': "691234567",
            'password': "FarelPassword2026!",
        }
        response = self.client.post('/api/v1/auth/login/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)

    def test_customer_profile_and_isolation(self):
        # Authenticate
        self.client.force_authenticate(user=self.user)

        # GET profile
        res = self.client.get('/api/v1/auth/profile/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['email'], "nicolas.song@farel.cm")

        # PATCH profile
        patch_res = self.client.patch('/api/v1/auth/profile/', {'first_name': "Nicolas Rigobert"}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['user']['first_name'], "Nicolas Rigobert")

    def test_address_crud_and_strict_customer_isolation(self):
        other_user = User.objects.create_user(
            email="autre.client@farel.cm",
            phone="+237677889900",
            password="OtherPassword2026!",
        )
        other_addr = Address.objects.create(
            user=other_user,
            recipient_name="Autre Client",
            phone_number="+237677889900",
            region="Centre",
            city="Yaoundé",
            neighborhood="Bastos",
        )

        self.client.force_authenticate(user=self.user)

        # Create address for self
        create_res = self.client.post('/api/v1/auth/addresses/', {
            'recipient_name': "Nicolas Song",
            'phone_number': "+237 691 23 45 67",
            'region': "Littoral",
            'city': "Douala",
            'neighborhood': "Bonapriso",
            'landmark': "Rue Tokoto",
            'is_default': True,
        }, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        my_addr_id = create_res.data['id']

        # List addresses: returns only self address
        list_res = self.client.get('/api/v1/auth/addresses/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        results = list_res.data['results'] if 'results' in list_res.data else list_res.data
        ids = [item['id'] for item in results]
        self.assertIn(my_addr_id, ids)
        self.assertNotIn(str(other_addr.id), ids)

        # Attempt to access or delete other user's address: returns 404
        access_other = self.client.get(f'/api/v1/auth/addresses/{other_addr.id}/')
        self.assertEqual(access_other.status_code, status.HTTP_404_NOT_FOUND)

        delete_other = self.client.delete(f'/api/v1/auth/addresses/{other_addr.id}/')
        self.assertEqual(delete_other.status_code, status.HTTP_404_NOT_FOUND)

    def test_password_change_and_reset_workflow(self):
        self.client.force_authenticate(user=self.user)

        # Change password
        ch_res = self.client.post('/api/v1/auth/change-password/', {
            'old_password': "FarelPassword2026!",
            'new_password': "BrandNewPassword2026!",
            'new_password_confirm': "BrandNewPassword2026!",
        }, format='json')
        self.assertEqual(ch_res.status_code, status.HTTP_200_OK)

        # Verify old password no longer works
        self.client.logout()
        fail_res = self.client.post('/api/v1/auth/login/', {
            'identifier': "nicolas.song@farel.cm",
            'password': "FarelPassword2026!",
        }, format='json')
        self.assertEqual(fail_res.status_code, status.HTTP_400_BAD_REQUEST)

        # Password reset request
        reset_req = self.client.post('/api/v1/auth/password-reset/request/', {
            'identifier': "nicolas.song@farel.cm",
        }, format='json')
        self.assertEqual(reset_req.status_code, status.HTTP_200_OK)
        self.assertIn('dev_debug', reset_req.data)

        debug_info = reset_req.data['dev_debug']
        uidb64 = debug_info['uidb64']
        token = debug_info['token']

        # Confirm password reset
        confirm_res = self.client.post('/api/v1/auth/password-reset/confirm/', {
            'uidb64': uidb64,
            'token': token,
            'new_password': "ResetPasswordSuccess2026!",
            'new_password_confirm': "ResetPasswordSuccess2026!",
        }, format='json')
        self.assertEqual(confirm_res.status_code, status.HTTP_200_OK)

        # Login with newly reset password
        login_res = self.client.post('/api/v1/auth/login/', {
            'identifier': "nicolas.song@farel.cm",
            'password': "ResetPasswordSuccess2026!",
        }, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
