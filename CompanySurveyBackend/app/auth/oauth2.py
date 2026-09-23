"""Compatibility exports for the active authentication module.

The application uses app.auth.auth as the source of truth. Keep this module so
older imports continue to resolve without carrying duplicate auth logic.
"""

from app.auth.auth import (
    ALGORITHM,
    SECRET_KEY,
    decode_access_token,
    get_current_user,
    oauth2_scheme,
)
