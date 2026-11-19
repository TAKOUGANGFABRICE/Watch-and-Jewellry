import re
import secrets
import string
from datetime import datetime

def generate_order_number() -> str:
    """Generate human-readable luxury order identifier: FRL-YYYY-XXXXX"""
    year = datetime.now().year
    random_part = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(5))
    return f"FRL-{year}-{random_part}"

def generate_transaction_ref() -> str:
    """Generate internal transaction reference: TXN-FRL-XXXXX"""
    timestamp = datetime.now().strftime('%m%d%H%M')
    random_part = ''.join(secrets.choice(string.digits) for _ in range(4))
    return f"TXN-FRL-{timestamp}{random_part}"

def format_fcfa(amount) -> str:
    """Format decimal/int into standard Cameroon FCFA display string: 150 000 FCFA"""
    if amount is None:
        return "0 FCFA"
    try:
        val = int(round(float(amount)))
        formatted = f"{val:,}".replace(',', ' ')
        return f"{formatted} FCFA"
    except (ValueError, TypeError):
        return f"{amount} FCFA"

def normalize_cameroon_phone(phone: str) -> str:
    """
    Normalizes Cameroon phone number into E.164 standard (+2376XXXXXXXX).
    Cameroon mobile numbers are 9 digits starting with 6 (e.g., 67x, 69x, 65x, 68x).
    """
    if not phone:
        return ""
    cleaned = re.sub(r'[\s\-\(\)]', '', phone.strip())
    if cleaned.startswith('+237'):
        cleaned = cleaned[4:]
    elif cleaned.startswith('00237'):
        cleaned = cleaned[5:]
    elif cleaned.startswith('237'):
        cleaned = cleaned[3:]

    # Remove leading zero if present
    if cleaned.startswith('0') and len(cleaned) == 10:
        cleaned = cleaned[1:]

    if len(cleaned) == 9 and cleaned.startswith('6'):
        return f"+237{cleaned}"
    
    return phone.strip()

def is_valid_cameroon_phone(phone: str) -> bool:
    """Validates whether a phone number matches Cameroon telecom operators."""
    normalized = normalize_cameroon_phone(phone)
    return bool(re.match(r'^\+2376[0-9]{8}$', normalized))

