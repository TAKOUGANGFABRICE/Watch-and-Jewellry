from rest_framework.views import exception_handler
from rest_framework.response import Response

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        message = "An error occurred while processing your request."
        errors = response.data

        if isinstance(response.data, dict):
            if 'detail' in response.data:
                message = response.data['detail']
            elif 'non_field_errors' in response.data:
                message = " ".join(response.data['non_field_errors'])
            else:
                first_key = next(iter(response.data))
                first_val = response.data[first_key]
                if isinstance(first_val, list):
                    message = f"{first_key}: {first_val[0]}"
                else:
                    message = f"{first_key}: {first_val}"
        elif isinstance(response.data, list) and len(response.data) > 0:
            message = str(response.data[0])

        response.data = {
            'success': False,
            'message': message,
            'errors': errors,
            'status_code': response.status_code,
        }

    return response

