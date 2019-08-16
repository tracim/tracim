from marshmallow.validate import Length

from tracim_backend.applications.upload_permissions.models import UploadPermission

upload_permission_email_validator = Length(
    min=UploadPermission.MIN_EMAIL_LENGTH, max=UploadPermission.MAX_EMAIL_LENGTH
)
upload_permission_password_validator = Length(
    min=UploadPermission.MIN_PASSWORD_LENGTH, max=UploadPermission.MAX_PASSWORD_LENGTH
)
