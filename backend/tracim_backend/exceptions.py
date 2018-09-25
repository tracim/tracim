# -*- coding: utf-8 -*-
from tracim_backend.error_code import *


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
    error_code = ERROR_CODE_USER_ALREADY_EXIST


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
    error_code = ERROR_CODE_SAME_VALUE_ERROR


class NotAuthenticated(TracimException):
    error_code = ERROR_CODE_NOT_AUTHENTICATED


class WorkspaceNotFound(NotFound):
    error_code = ERROR_CODE_WORKSPACE_NOT_FOUND


class WorkspaceNotFoundInTracimRequest(NotFound):
    error_code = ERROR_CODE_WORKSPACE_NOT_IN_TRACIM_REQUEST


class InsufficientUserRoleInWorkspace(TracimException):
    error_code = ERROR_CODE_INSUFFICIENT_USER_ROLE_IN_WORKSPACE


class InsufficientUserProfile(TracimException):
    error_code = ERROR_CODE_INSUFFICIENT_USER_PROFILE


class ImmutableAttribute(TracimException):
    pass


class DigestAuthNotImplemented(Exception):
    pass


class AuthenticationFailed(TracimException):
    error_code = ERROR_CODE_AUTHENTICATION_FAILED


class WrongUserPassword(TracimException):
    error_code = ERROR_CODE_WRONG_USER_PASSWORD


class UnvalidResetPasswordToken(TracimException):
    error_code = ERROR_CODE_INVALID_RESET_PASSWORD_TOKEN
    pass


class ExpiredResetPasswordToken(TracimException):
    error_code = ERROR_CODE_EXPIRED_RESET_PASSWORD_TOKEN


class NotificationNotSend(TracimException):
    pass


class GroupDoesNotExist(TracimError):
    pass


class ContentStatusNotExist(TracimError):
    pass


class ContentTypeNotExist(TracimError):
    pass


class UserDoesNotExist(TracimException):
    error_code = ERROR_CODE_USER_NOT_FOUND


class UserNotFoundInTracimRequest(TracimException):
    error_code = ERROR_CODE_USER_NOT_IN_TRACIM_REQUEST


class ContentNotFoundInTracimRequest(TracimException):
    error = ERROR_CODE_CONTENT_NOT_IN_TRACIM_REQUEST


class InvalidId(TracimException):
    pass


class InvalidContentId(InvalidId):
    error_code = ERROR_CODE_CONTENT_INVALID_ID


class InvalidCommentId(InvalidId):
    error_code = ERROR_CODE_COMMENT_INVALID_ID


class InvalidWorkspaceId(InvalidId):
    error_code = ERROR_CODE_WORKSPACE_INVALID_ID


class InvalidUserId(InvalidId):
    error_code = ERROR_CODE_USER_INVALID_USER_ID


class ContentNotFound(TracimException):
    error_code = ERROR_CODE_CONTENT_NOT_FOUND


class ContentTypeNotAllowed(TracimException):
    error_code = ERROR_CODE_CONTENT_TYPE_NOT_ALLOWED


class WorkspacesDoNotMatch(TracimException):
    error_code = ERROR_CODE_WORKSPACE_DO_NOT_MATCH


class PasswordDoNotMatch(TracimException):
    error_code = ERROR_CODE_PASSWORD_DO_NOT_MATCH


class EmptyValueNotAllowed(TracimException):
    pass


class TracimUnavailablePreviewType(TracimException):
    error_code = ERROR_CODE_UNAIVALABLE_PREVIEW_TYPE


class EmptyLabelNotAllowed(EmptyValueNotAllowed):
    pass


class EmptyCommentContentNotAllowed(EmptyValueNotAllowed):
    pass


class UserNotActive(TracimException):
    error_code = ERROR_CODE_USER_NOT_ACTIVE


class NoUserSetted(TracimException):
    pass


class RoleDoesNotExist(TracimException):
    pass


class EmailValidationFailed(TracimException):
    error_code = ERROR_CODE_EMAIL_VALIDATION_FAILED


class InconsistentDatabase(TracimException):
    pass


class ContentLabelAlreadyUsedHere(TracimException):
    error_code = ERROR_CODE_CONTENT_LABEL_ALREADY_USED_THERE


class ParentNotFound(NotFound):
    error_code = ERROR_CODE_PARENT_NOT_FOUND


class RevisionDoesNotMatchThisContent(TracimException):
    pass


class PageOfPreviewNotFound(NotFound):
    error_code = ERROR_CODE_PAGE_OF_PREVIEW_NOT_FOUND


class PreviewDimNotAllowed(TracimException):
    error_code = ERROR_CODE_PREVIEW_DIM_NOT_ALLOWED


class UnallowedSubContent(TracimException):
    error_code = ERROR_CODE_EMAIL_UNALLOWED_SUBCONTENT


class TooShortAutocompleteString(TracimException):
    pass


class PageNotFound(TracimException):
    pass


class AppDoesNotExist(TracimException):
    pass


class EmailAlreadyExistInDb(TracimException):
    error_code = ERROR_CODE_EMAIL_ALREADY_EXIST_IN_DB


class UnavailablePreview(TracimException):
    error_code = ERROR_CODE_UNAIVALABLE_PREVIEW
