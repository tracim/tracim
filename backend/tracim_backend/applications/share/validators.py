from marshmallow.validate import Length

from tracim_backend.applications.share.models import ContentShare

share_email_validator = Length(min=ContentShare.MIN_EMAIL_LENGTH, max=ContentShare.MAX_EMAIL_LENGTH)
share_password_validator = Length(
    min=ContentShare.MIN_PASSWORD_LENGTH, max=ContentShare.MAX_PASSWORD_LENGTH
)
