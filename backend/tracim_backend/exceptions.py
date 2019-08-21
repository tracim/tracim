# -*- coding: utf-8 -*-
from tracim_backend.error import ErrorCode


class TracimError(Exception):
    pass


class NoValidCollaborativeDocumentEditionSoftware(TracimError):
    pass


class TracimException(Exception):
    pass


class RunTimeError(TracimError):
    pass


class NotAFileError(Exception):
    pass


class NotWritableDirectory(Exception):
    pass


class NotReadableFile(Exception):
    pass


class NotReadableDirectory(Exception):
    pass


class ContentRevisionUpdateError(RuntimeError):
    pass


class ContentRevisionDeleteError(ContentRevisionUpdateError):
    pass


class ConfigurationError(TracimError):
    pass


class ConfigCodeError(TracimError):
    pass


class EmailTemplateError(TracimException):
    pass


class UserAlreadyExistError(TracimError):
    error_code = ErrorCode.USER_ALREADY_EXIST


class RoleAlreadyExistError(TracimError):
    error_code = ErrorCode.USER_ROLE_ALREADY_EXIST


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


class WorkspaceAgendaDisabledException(TracimException):
    error_code = ErrorCode.WORKSPACE_AGENDA_DISABLED


class AgendaServerConnectionError(TracimException):
    pass


class CannotCreateAgenda(TracimException):
    pass


class AgendaPropsUpdateFailed(TracimException):
    pass


class AgendaException(TracimException):
    pass


class UnknownAgendaType(AgendaException):
    pass


class NotFound(TracimException):
    pass


class NoValidSearchEngine(TracimException):
    pass


class SameValueError(ValueError):
    error_code = ErrorCode.SAME_VALUE_ERROR


class NotAuthenticated(TracimException):
    pass


class FileTemplateNotAvailable(TracimException):
    error_code = ErrorCode.FILE_TEMPLATE_NOT_AVAILABLE


class CaldavNotAuthenticated(NotAuthenticated):
    error_code = ErrorCode.CALDAV_NOT_AUTHENTICATED


class CaldavNotAuthorized(TracimException):
    error_code = ErrorCode.CALDAV_NOT_AUTHORIZED


class WorkspaceNotFound(NotFound):
    error_code = ErrorCode.WORKSPACE_NOT_FOUND


class UploadPermissionNotFound(NotFound):
    error_code = ErrorCode.UPLOAD_PERMISSION_NOT_FOUND


class ContentShareNotFound(NotFound):
    error_code = ErrorCode.CONTENT_SHARE_NOT_FOUND


class WorkspaceNotFoundInTracimRequest(NotFound):
    error_code = ErrorCode.WORKSPACE_NOT_IN_TRACIM_REQUEST


class ContentTypeNotInTracimRequest(NotFound):
    error_code = ErrorCode.CONTENT_TYPE_NOT_IN_TRACIM_REQUEST


class InsufficientUserRoleInWorkspace(TracimException):
    error_code = ErrorCode.INSUFFICIENT_USER_ROLE_IN_WORKSPACE


class InsufficientUserProfile(TracimException):
    error_code = ErrorCode.INSUFFICIENT_USER_PROFILE


class ImmutableAttribute(TracimException):
    pass


class DigestAuthNotImplemented(Exception):
    pass


class AuthenticationFailed(TracimException):
    error_code = ErrorCode.AUTHENTICATION_FAILED


class WrongUserPassword(TracimException):
    error_code = ErrorCode.WRONG_USER_PASSWORD


class WrongSharePassword(TracimException):
    error_code = ErrorCode.WRONG_SHARE_PASSWORD


class UnvalidResetPasswordToken(TracimException):
    error_code = ErrorCode.INVALID_RESET_PASSWORD_TOKEN
    pass


class ExpiredResetPasswordToken(TracimException):
    error_code = ErrorCode.EXPIRED_RESET_PASSWORD_TOKEN


class NotificationSendingFailed(TracimException):
    error_code = ErrorCode.NOTIFICATION_SENDING_FAILED


class NotificationDisabledCantCreateUserWithInvitation(TracimException):
    error_code = ErrorCode.NOTIFICATION_DISABLED_CANT_NOTIFY_NEW_USER


class NotificationDisabledCantResetPassword(TracimException):
    error_code = ErrorCode.NOTIFICATION_DISABLED_CANT_RESET_PASSWORD


class GroupDoesNotExist(TracimError):
    pass


class ContentStatusNotExist(TracimError):
    pass


class ContentTypeNotExist(TracimError):
    error_code = ErrorCode.CONTENT_TYPE_NOT_EXIST


class UserDoesNotExist(TracimException):
    error_code = ErrorCode.USER_NOT_FOUND


class UserNotFoundInTracimRequest(TracimException):
    error_code = ErrorCode.USER_NOT_IN_TRACIM_REQUEST


class ContentNotFoundInTracimRequest(TracimException):
    error_code = ErrorCode.CONTENT_NOT_IN_TRACIM_REQUEST


class InvalidId(TracimException):
    pass


class InvalidContentId(InvalidId):
    error_code = ErrorCode.CONTENT_INVALID_ID


class InvalidCommentId(InvalidId):
    error_code = ErrorCode.COMMENT_INVALID_ID


class InvalidWorkspaceId(InvalidId):
    error_code = ErrorCode.WORKSPACE_INVALID_ID


class InvalidUserId(InvalidId):
    error_code = ErrorCode.USER_INVALID_USER_ID


class ContentNotFound(TracimException):
    error_code = ErrorCode.CONTENT_NOT_FOUND


class ContentTypeNotAllowed(TracimException):
    error_code = ErrorCode.CONTENT_TYPE_NOT_ALLOWED


class WorkspacesDoNotMatch(TracimException):
    error_code = ErrorCode.WORKSPACE_DO_NOT_MATCH


class ContentNamespaceDoNotMatch(TracimException):
    error_code = ErrorCode.CONTENT_NAMESPACE_DO_NOT_MATCH


class PasswordDoNotMatch(TracimException):
    error_code = ErrorCode.PASSWORD_DO_NOT_MATCH


class EmptyValueNotAllowed(TracimException):
    pass


class TracimUnavailablePreviewType(TracimException):
    error_code = ErrorCode.UNAVAILABLE_PREVIEW_TYPE


class EmptyLabelNotAllowed(EmptyValueNotAllowed):
    pass


class UserNotAllowedToCreateMoreWorkspace(TracimException):
    error_code = ErrorCode.USER_NOT_ALLOWED_TO_CREATE_MORE_WORKSPACES


class EmptyCommentContentNotAllowed(EmptyValueNotAllowed):
    error_code = ErrorCode.EMPTY_COMMENT_NOT_ALLOWED


class EmptyEmailBody(EmptyValueNotAllowed):
    pass


class AutoReplyEmailNotAllowed(TracimException):
    pass


class NoSpecialKeyFound(EmptyValueNotAllowed):
    pass


class UnsupportedRequestMethod(TracimException):
    pass


class CommentRequestCreationFailed(TracimException):
    pass


class BadStatusCode(TracimException):
    pass


class WrongLDAPCredentials(TracimException):
    pass


class RemoteUserAuthDisabled(TracimException):
    pass


class UserAuthenticatedIsDeleted(TracimException):
    error_code = ErrorCode.AUTHENTICATION_FAILED


class UserAuthenticatedIsNotActive(TracimException):
    error_code = ErrorCode.AUTHENTICATION_FAILED


class UserIsNotActive(TracimException):
    error_code = ErrorCode.USER_NOT_ACTIVE


class UserIsDeleted(TracimException):
    error_code = ErrorCode.USER_DELETED


class UserCantDisableHimself(TracimException):
    error_code = ErrorCode.USER_CANT_DISABLE_HIMSELF


class UserCantDeleteHimself(TracimException):
    error_code = ErrorCode.USER_CANT_DELETE_HIMSELF


class UserCantRemoveHisOwnRoleInWorkspace(TracimException):
    error_code = ErrorCode.USER_CANT_REMOVE_IS_OWN_ROLE_IN_WORKSPACE


class UserCantChangeIsOwnProfile(TracimException):
    error_code = ErrorCode.USER_CANT_CHANGE_IS_OWN_PROFILE


class UserIsNotContentOwner(TracimException):
    pass


class UserGivenIsNotTheSameAsAuthenticated(TracimException):
    pass


class NoUserSetted(TracimException):
    pass


class RoleDoesNotExist(TracimException):
    pass


class UserRoleNotFound(TracimException):
    error_code = ErrorCode.USER_ROLE_NOT_FOUND


class TracimValidationFailed(TracimException):
    error_code = ErrorCode.INTERNAL_TRACIM_VALIDATION_ERROR


class EmailValidationFailed(TracimValidationFailed):
    error_code = ErrorCode.INTERNAL_TRACIM_VALIDATION_ERROR


class InconsistentDatabase(TracimException):
    pass


class ContentFilenameAlreadyUsedInFolder(TracimException):
    error_code = ErrorCode.CONTENT_FILENAME_ALREADY_USED_IN_FOLDER


class WorkspaceLabelAlreadyUsed(TracimException):
    error_code = ErrorCode.WORKSPACE_LABEL_ALREADY_USED


class ParentNotFound(NotFound):
    error_code = ErrorCode.PARENT_NOT_FOUND


class RevisionDoesNotMatchThisContent(TracimException):
    pass


class PageOfPreviewNotFound(NotFound):
    error_code = ErrorCode.PAGE_OF_PREVIEW_NOT_FOUND


class PreviewDimNotAllowed(TracimException):
    error_code = ErrorCode.PREVIEW_DIM_NOT_ALLOWED


class UnallowedSubContent(TracimException):
    error_code = ErrorCode.UNALLOWED_SUBCONTENT


class TooShortAutocompleteString(TracimException):
    pass


class PageNotFound(TracimException):
    pass


class AppDoesNotExist(TracimException):
    pass


class EmailAlreadyExistInDb(TracimException):
    error_code = ErrorCode.EMAIL_ALREADY_EXIST_IN_DB


class UnavailablePreview(TracimException):
    error_code = ErrorCode.UNAIVALABLE_PREVIEW


class EmptyNotificationError(TracimException):
    pass


class ContentInNotEditableState(TracimException):
    error_code = ErrorCode.CONTENT_IN_NOT_EDITABLE_STATE


class UnknownAuthType(TracimException):
    pass


class MissingLDAPConnector(TracimException):
    pass


class WrongAuthTypeForUser(TracimException):
    pass


class UserAuthTypeDisabled(TracimException):
    error_code = ErrorCode.USER_AUTH_TYPE_DISABLED


class DisabledFeatureForExternalAuth(TracimException):
    pass


class ExternalAuthUserEmailModificationDisallowed(DisabledFeatureForExternalAuth):
    error_code = ErrorCode.EXTERNAL_AUTH_USER_EMAIL_MODIFICATION_UNALLOWED


class ExternalAuthUserPasswordModificationDisallowed(DisabledFeatureForExternalAuth):
    error_code = ErrorCode.EXTERNAL_AUTH_USER_PASSWORD_MODIFICATION_UNALLOWED


class DepotCorrupted(TracimException):
    pass


class RevisionFilePathSearchFailedDepotCorrupted(DepotCorrupted):
    pass


class NewRevisionAbortedDepotCorrupted(DepotCorrupted):
    pass


class CopyRevisionAbortedDepotCorrupted(DepotCorrupted):
    pass


class TracimFileNotFound(FileNotFoundError, DepotCorrupted):
    pass


class ContentStatusException(TracimError):
    error_code = ErrorCode.INVALID_STATUS_CHANGE


class ConflictingMoveInItself(TracimException):
    error_code = ErrorCode.CONFLICTING_MOVE_IN_ITSELF


class ConflictingMoveInChild(TracimException):
    error_code = ErrorCode.CONFLICTING_MOVE_IN_CHILD
