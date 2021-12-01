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


class TranslationConfigurationError(ConfigurationError):
    pass


class ConfigCodeError(TracimError):
    pass


class EmailTemplateError(TracimException):
    pass


class UserAlreadyExistError(TracimError):
    error_code = ErrorCode.USER_ALREADY_EXIST


class RoleAlreadyExistError(TracimError):
    error_code = ErrorCode.USER_ROLE_ALREADY_EXIST


class ReactionAlreadyExistError(TracimError):
    error_code = ErrorCode.REACTION_ALREADY_EXISTS


class TagAlreadyExistsError(TracimError):
    error_code = ErrorCode.TAG_ALREADY_EXISTS


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


class UserSelfRegistrationDisabledException(TracimException):
    error_code = ErrorCode.USER_SELF_REGISTRATION_DISABLED


class WorkspaceAgendaDisabledException(TracimException):
    error_code = ErrorCode.WORKSPACE_AGENDA_DISABLED


class WorkspacePublicUploadDisabledException(TracimException):
    error_code = ErrorCode.WORKSPACE_PUBLIC_UPLOAD_DISABLED


class WorkspacePublicDownloadDisabledException(TracimException):
    error_code = ErrorCode.WORKSPACE_PUBLIC_DOWNLOAD_DISABLED


class AgendaServerConnectionError(TracimException):
    pass


class CannotCreateAgendaResource(TracimException):
    pass


class AgendaNotFoundError(TracimException):
    pass


class UserCannotBeDeleted(TracimException):
    pass


class AgendaPropsUpdateFailed(TracimException):
    pass


class AgendaException(TracimException):
    pass


class UnknownAgendaType(AgendaException):
    pass


class NotFound(TracimException):
    pass


class NoFileValidationError(TracimException):
    error_code = ErrorCode.NO_FILE_VALIDATION_ERROR


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


class ReactionNotFound(NotFound):
    error_code = ErrorCode.REACTION_NOT_FOUND


class TagNotFound(NotFound):
    error_code = ErrorCode.TAG_NOT_FOUND


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


class InvalidWorkspaceAccessType(TracimException):
    error_code = ErrorCode.INVALID_WORKSPACE_ACCESS_TYPE


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


class InvalidResetPasswordToken(TracimException):
    error_code = ErrorCode.INVALID_RESET_PASSWORD_TOKEN
    pass


class ExpiredResetPasswordToken(TracimException):
    error_code = ErrorCode.EXPIRED_RESET_PASSWORD_TOKEN


class NotificationSendingFailed(TracimException):
    error_code = ErrorCode.NOTIFICATION_SENDING_FAILED


class NotificationDisabledCantCreateUserWithInvitation(TracimException):
    error_code = ErrorCode.NOTIFICATION_DISABLED_CANT_NOTIFY_NEW_USER


class MissingEmailCantResetPassword(TracimException):
    error_code = ErrorCode.MISSING_EMAIL_CANT_RESET_PASSWORD


class NotificationDisabledCantResetPassword(TracimException):
    error_code = ErrorCode.NOTIFICATION_DISABLED_CANT_RESET_PASSWORD


class ContentStatusNotExist(TracimError):
    pass


class ContentTypeNotExist(TracimError):
    error_code = ErrorCode.CONTENT_TYPE_NOT_EXIST


class UserDoesNotExist(TracimException):
    error_code = ErrorCode.USER_NOT_FOUND


class MessageDoesNotExist(TracimException):
    error_code = ErrorCode.MESSAGE_NOT_FOUND


class UserNotFoundInTracimRequest(TracimException):
    error_code = ErrorCode.USER_NOT_IN_TRACIM_REQUEST


class ContentNotFoundInTracimRequest(TracimException):
    error_code = ErrorCode.CONTENT_NOT_IN_TRACIM_REQUEST


class ReactionNotFoundInTracimRequest(TracimException):
    error_code = ErrorCode.REACTION_NOT_IN_TRACIM_REQUEST


class InvalidId(TracimException):
    pass


class InvalidContentId(InvalidId):
    error_code = ErrorCode.CONTENT_INVALID_ID


class InvalidCommentId(InvalidId):
    error_code = ErrorCode.COMMENT_INVALID_ID


class InvalidReactionId(InvalidId):
    error_code = ErrorCode.REACTION_INVALID_ID


class InvalidWorkspaceId(InvalidId):
    error_code = ErrorCode.WORKSPACE_INVALID_ID


class InvalidUserId(InvalidId):
    error_code = ErrorCode.USER_INVALID_USER_ID


class ContentNotFound(TracimException):
    error_code = ErrorCode.CONTENT_NOT_FOUND


class FavoriteContentNotFound(TracimException):
    error_code = ErrorCode.FAVORITE_CONTENT_NOT_FOUND


class ContentTypeNotAllowed(TracimException):
    error_code = ErrorCode.CONTENT_TYPE_NOT_ALLOWED


class MimetypeNotAllowed(TracimException):
    error_code = ErrorCode.MIMETYPE_NOT_ALLOWED


class WorkspacesDoNotMatch(TracimException):
    error_code = ErrorCode.WORKSPACE_DO_NOT_MATCH


class ContentNamespaceDoNotMatch(TracimException):
    error_code = ErrorCode.CONTENT_NAMESPACE_DO_NOT_MATCH


class PasswordDoNotMatch(TracimException):
    error_code = ErrorCode.PASSWORD_DO_NOT_MATCH


class EmptyValueNotAllowed(TracimException):
    pass


class FileSizeOverMaxLimitation(TracimException):
    error_code = ErrorCode.FILE_SIZE_OVER_MAX_LIMITATION


class FileSizeOverWorkspaceEmptySpace(TracimException):
    error_code = ErrorCode.FILE_SIZE_OVER_WORKSPACE_EMPTY_SPACE


class FileSizeOverOwnerEmptySpace(TracimException):
    error_code = ErrorCode.FILE_SIZE_OVER_OWNER_EMPTY_SPACE


class TracimUnavailablePreviewType(TracimException):
    error_code = ErrorCode.UNAVAILABLE_PREVIEW_TYPE


class UserImageNotFound(NotFound):
    error_code = ErrorCode.USER_IMAGE_NOT_FOUND


class EmptyLabelNotAllowed(EmptyValueNotAllowed):
    pass


class DisallowedWorkspaceAccessType(TracimException):
    error_code = ErrorCode.DISALLOWED_WORKSPACE_ACCESS_TYPE


class UserNotAllowedToCreateMoreWorkspace(TracimException):
    error_code = ErrorCode.USER_NOT_ALLOWED_TO_CREATE_MORE_WORKSPACES


class EmptyCommentContentNotAllowed(EmptyValueNotAllowed):
    error_code = ErrorCode.EMPTY_COMMENT_NOT_ALLOWED


class EmptyEmailBody(EmptyValueNotAllowed):
    pass


class AutoReplyEmailNotAllowed(TracimException):
    pass


class NoKeyFound(EmptyValueNotAllowed):
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


class UserNotMemberOfWorkspace(TracimException):
    error_code = ErrorCode.USER_NOT_MEMBER_OF_WORKSPACE


class LastWorkspaceManagerRoleCantBeModified(TracimException):
    error_code = ErrorCode.LAST_WORKSPACE_MANAGER_ROLE_CANT_BE_MODIFIED


class UserCantChangeIsOwnProfile(TracimException):
    error_code = ErrorCode.USER_CANT_CHANGE_IS_OWN_PROFILE


class UserIsNotContentOwner(TracimException):
    pass


class UserIsNotReactionAuthor(TracimException):
    pass


class UserGivenIsNotTheSameAsAuthenticated(TracimException):
    pass


class NoUserSetted(TracimException):
    pass


class RoleDoesNotExist(TracimException):
    pass


class ProfileDoesNotExist(TracimException):
    pass


class SubcriptionDoesNotExist(TracimException):
    pass


class UserRoleNotFound(TracimException):
    error_code = ErrorCode.USER_ROLE_NOT_FOUND


class TracimValidationFailed(TracimException):
    error_code = ErrorCode.INTERNAL_TRACIM_VALIDATION_ERROR


class EmailValidationFailed(TracimValidationFailed):
    error_code = ErrorCode.INTERNAL_TRACIM_VALIDATION_ERROR


class EmailOrUsernameRequired(TracimValidationFailed):
    error_code = ErrorCode.EMAIL_OR_USERNAME_REQUIRED


class EmailRequired(TracimValidationFailed):
    error_code = ErrorCode.EMAIL_REQUIRED


class InvalidUsernameFormat(TracimValidationFailed):
    error_code = ErrorCode.INVALID_USERNAME_FORMAT


class InconsistentDatabase(TracimException):
    pass


class ContentFilenameAlreadyUsedInFolder(TracimException):
    error_code = ErrorCode.CONTENT_FILENAME_ALREADY_USED_IN_FOLDER


class ParentNotFound(NotFound):
    error_code = ErrorCode.PARENT_NOT_FOUND


class RevisionDoesNotMatchThisContent(TracimException):
    pass


class PreviewGeneratorPassthroughError(TracimException):
    pass


class PageOfPreviewNotFound(NotFound, PreviewGeneratorPassthroughError):
    error_code = ErrorCode.PAGE_OF_PREVIEW_NOT_FOUND


class PreviewDimNotAllowed(TracimException):
    error_code = ErrorCode.PREVIEW_DIM_NOT_ALLOWED


class UnallowedSubContent(TracimException):
    error_code = ErrorCode.UNALLOWED_SUBCONTENT


class TooShortAutocompleteString(TracimException):
    error_code = ErrorCode.ACP_STRING_TOO_SHORT
    pass


class CannotUseBothIncludeAndExcludeWorkspaceUsers(TracimException):
    pass


class PageNotFound(TracimException):
    error_code = ErrorCode.PAGE_NOT_FOUND


class AppDoesNotExist(TracimException):
    pass


class EmailAlreadyExists(TracimException):
    error_code = ErrorCode.EMAIL_ALREADY_EXISTS


class UsernameAlreadyExists(TracimException):
    error_code = ErrorCode.USERNAME_ALREADY_EXISTS


class UnavailablePreview(TracimException):
    error_code = ErrorCode.UNAVAILABLE_FILE_PREVIEW


class UnavailableURLPreview(TracimException):
    error_code = ErrorCode.UNAVAILABLE_URL_PREVIEW


class EmptyNotificationError(TracimException):
    pass


class ContentInNotEditableState(TracimException):
    error_code = ErrorCode.CONTENT_IN_NOT_EDITABLE_STATE


class UnknownAuthType(TracimException):
    pass


class AllUsersAreNotKnown(TracimException):
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


class CannotGetDepotFileDepotCorrupted(DepotCorrupted):
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


class CannotDeleteUniqueRevisionWithoutDeletingContent(Exception):
    pass


class ReservedUsernameError(TracimException):
    error_code = ErrorCode.RESERVED_USERNAME


class UserFollowAlreadyDefined(TracimException):
    error_code = ErrorCode.USER_FOLLOW_ALREADY_DEFINED


class AdvancedSearchNotEnabled(TracimException):
    error_code = ErrorCode.ADVANCED_SEARCH_NOT_ENABLED


class IndexingError(TracimException):
    pass


class WorkspaceFeatureDisabled(TracimException):
    error_code = ErrorCode.WORKSPACE_FEATURE_DISABLED


class TooManyOnlineUsersError(TracimException):
    error_code = ErrorCode.TOO_MANY_ONLINE_USERS


class UserCallTransitionNotAllowed(TracimException):
    error_code = ErrorCode.USER_CALL_TRANSITION_NOT_ALLOWED


class UserCallNotFound(NotFound):
    error_code = ErrorCode.USER_CALL_NOT_FOUND
