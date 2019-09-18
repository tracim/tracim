from marshmallow.validate import Length

from tracim_backend.applications.upload_permissions.models import UploadPermission

upload_permission_email_validator = Length(
    min=UploadPermission.MIN_EMAIL_LENGTH, max=UploadPermission.MAX_EMAIL_LENGTH
)
upload_permission_password_validator = Length(
    min=UploadPermission.MIN_PASSWORD_LENGTH, max=UploadPermission.MAX_PASSWORD_LENGTH
)
UPLOAD_USERNAME_MINIMUM_LENGTH = 1
UPLOAD_USERNAME_MAXIMUM_LENGTH = 255
upload_username_length_validator = Length(
    min=UPLOAD_USERNAME_MINIMUM_LENGTH, max=UPLOAD_USERNAME_MAXIMUM_LENGTH
)
