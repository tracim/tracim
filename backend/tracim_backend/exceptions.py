# -*- coding: utf-8 -*-
from tracim_backend import error


class TracimError(Exception):
    pass


class TracimException(Exception):
    pass


class RunTimeError(TracimError):
    pass


class ContentRevisionUpdateError(RuntimeError):
    pass


class ContentRevisionDeleteError(ContentRevisionUpdateError):
    pass


class ConfigurationError(TracimError):
    pass


class UserAlreadyExistError(TracimError):
    error_code = error.USER_ALREADY_EXIST


class RoleAlreadyExistError(TracimError):
    error_code = error.USER_ROLE_ALREADY_EXIST


class ForceArgumentNeeded(TracimException):
    pass


class InvalidSettingFile(TracimException):
    pass


class DatabaseInitializationFailed(TracimException):
    pass


class BadCommandError(TracimError):
    pass


class DaemonException(TracimException):
    pass


class AlreadyRunningDaemon(DaemonException):
    pass


class CalendarException(TracimException):
    pass


class UnknownCalendarType(CalendarException):
    pass


class NotFound(TracimException):
    pass


class SameValueError(ValueError):
    error_code = error.SAME_VALUE_ERROR


class NotAuthenticated(TracimException):
    pass


class WorkspaceNotFound(NotFound):
    error_code = error.WORKSPACE_NOT_FOUND


class WorkspaceNotFoundInTracimRequest(NotFound):
    error_code = error.WORKSPACE_NOT_IN_TRACIM_REQUEST


class InsufficientUserRoleInWorkspace(TracimException):
    error_code = error.INSUFFICIENT_USER_ROLE_IN_WORKSPACE


class InsufficientUserProfile(TracimException):
    error_code = error.INSUFFICIENT_USER_PROFILE


class ImmutableAttribute(TracimException):
    pass


class DigestAuthNotImplemented(Exception):
    pass


class AuthenticationFailed(TracimException):
    error_code = error.AUTHENTICATION_FAILED


class WrongUserPassword(TracimException):
    error_code = error.WRONG_USER_PASSWORD


class UnvalidResetPasswordToken(TracimException):
    error_code = error.INVALID_RESET_PASSWORD_TOKEN
    pass


class ExpiredResetPasswordToken(TracimException):
    error_code = error.EXPIRED_RESET_PASSWORD_TOKEN


class NotificationSendingFailed(TracimException):
    error_code = error.NOTIFICATION_SENDING_FAILED


class NotificationDisabledCantCreateUserWithInvitation(TracimException):
    error_code = error.NOTIFICATION_DISABLED_CANT_NOTIFY_NEW_USER


class NotificationDisabledCantResetPassword(TracimException):
    error_code = error.NOTIFICATION_DISABLED_CANT_RESET_PASSWORD


class GroupDoesNotExist(TracimError):
    pass


class ContentStatusNotExist(TracimError):
    pass


class ContentTypeNotExist(TracimError):
    pass


class UserDoesNotExist(TracimException):
    error_code = error.USER_NOT_FOUND


class UserNotFoundInTracimRequest(TracimException):
    error_code = error.USER_NOT_IN_TRACIM_REQUEST


class ContentNotFoundInTracimRequest(TracimException):
    error = error.CONTENT_NOT_IN_TRACIM_REQUEST


class InvalidId(TracimException):
    pass


class InvalidContentId(InvalidId):
    error_code = error.CONTENT_INVALID_ID


class InvalidCommentId(InvalidId):
    error_code = error.COMMENT_INVALID_ID


class InvalidWorkspaceId(InvalidId):
    error_code = error.WORKSPACE_INVALID_ID


class InvalidUserId(InvalidId):
    error_code = error.USER_INVALID_USER_ID


class ContentNotFound(TracimException):
    error_code = error.CONTENT_NOT_FOUND


class ContentTypeNotAllowed(TracimException):
    error_code = error.CONTENT_TYPE_NOT_ALLOWED


class WorkspacesDoNotMatch(TracimException):
    error_code = error.WORKSPACE_DO_NOT_MATCH


class PasswordDoNotMatch(TracimException):
    error_code = error.PASSWORD_DO_NOT_MATCH


class EmptyValueNotAllowed(TracimException):
    pass


class TracimUnavailablePreviewType(TracimException):
    error_code = error.UNAVAILABLE_PREVIEW_TYPE


class EmptyLabelNotAllowed(EmptyValueNotAllowed):
    pass


class EmptyCommentContentNotAllowed(EmptyValueNotAllowed):
    pass


class EmptyEmailBody(EmptyValueNotAllowed):
    pass


class NoSpecialKeyFound(EmptyValueNotAllowed):
    pass


class UnsupportedRequestMethod(TracimException):
    pass


class CommentRequestCreationFailed(TracimException):
    pass


class BadStatusCode(TracimException):
    pass


class UserAuthenticatedIsNotActive(TracimException):
    error_code = error.AUTHENTICATION_FAILED


class UserIsNotActive(TracimException):
    error_code = error.USER_NOT_ACTIVE


class UserIsDeleted(TracimException):
    error_code = error.USER_DELETED


class UserCantDisableHimself(TracimException):
    error_code = error.USER_CANT_DISABLE_HIMSELF


class UserCantDeleteHimself(TracimException):
    error_code = error.USER_CANT_DELETE_HIMSELF


class UserCantRemoveHisOwnRoleInWorkspace(TracimException):
    error_code = error.USER_CANT_REMOVE_IS_OWN_ROLE_IN_WORKSPACE


class UserCantChangeIsOwnProfile(TracimException):
    error_code = error.USER_CANT_CHANGE_IS_OWN_PROFILE


class NoUserSetted(TracimException):
    pass


class RoleDoesNotExist(TracimException):
    pass


class UserRoleNotFound(TracimException):
    error_code = error.USER_ROLE_NOT_FOUND


class EmailValidationFailed(TracimException):
    error_code = error.EMAIL_VALIDATION_FAILED


class InconsistentDatabase(TracimException):
    pass


class ContentFilenameAlreadyUsedInFolder(TracimException):
    error_code = error.CONTENT_FILENAME_ALREADY_USED_IN_FOLDER


class WorkspaceLabelAlreadyUsed(TracimException):
    error_code = error.WORKSPACE_LABEL_ALREADY_USED


class ParentNotFound(NotFound):
    error_code = error.PARENT_NOT_FOUND


class RevisionDoesNotMatchThisContent(TracimException):
    pass


class PageOfPreviewNotFound(NotFound):
    error_code = error.PAGE_OF_PREVIEW_NOT_FOUND


class PreviewDimNotAllowed(TracimException):
    error_code = error.PREVIEW_DIM_NOT_ALLOWED


class UnallowedSubContent(TracimException):
    error_code = error.UNALLOWED_SUBCONTENT


class TooShortAutocompleteString(TracimException):
    pass


class PageNotFound(TracimException):
    pass


class AppDoesNotExist(TracimException):
    pass


class EmailAlreadyExistInDb(TracimException):
    error_code = error.EMAIL_ALREADY_EXIST_IN_DB


class UnavailablePreview(TracimException):
    error_code = error.UNAIVALABLE_PREVIEW


class EmptyNotificationError(TracimException):
    pass


class ContentInNotEditableState(TracimException):
    error_code = error.CONTENT_IN_NOT_EDITABLE_STATE

