import i18n, { getBrowserLang } from './i18n.js'
import {
  addAllResourceI18n,
  addRevisionFromTLM,
  buildContentPathBreadcrumbs,
  createSpaceTree,
  handleFetchResult,
  displayDistanceDate,
  convertBackslashNToBr,
  naturalCompareLabels,
  revisionTypeList,
  generateRandomPassword,
  getCurrentContentVersionNumber,
  hasSpaces,
  BREADCRUMBS_TYPE,
  ROLE,
  ROLE_LIST,
  PROFILE,
  PROFILE_LIST,
  SPACE_TYPE,
  SPACE_TYPE_LIST,
  ACCESSIBLE_SPACE_TYPE_LIST,
  SUBSCRIPTION_TYPE,
  SUBSCRIPTION_TYPE_LIST,
  FETCH_CONFIG,
  APP_FEATURE_MODE,
  FILE_PREVIEW_STATE,
  IMG_LOAD_STATE,
  displayFileSize,
  parserStringToList,
  checkEmailValidity,
  buildFilePreviewUrl,
  splitFilenameExtension,
  removeExtensionOfFilename,
  computeProgressionPercentage,
  buildHeadTitle,
  CONTENT_TYPE,
  CONTENT_NAMESPACE,
  buildTracimLiveMessageEventType,
  sortTimelineByDate,
  removeAtInUsername,
  setupCommonRequestHeaders,
  serialize,
  getOrCreateSessionClientToken,
  ALLOWED_CHARACTERS_USERNAME,
  MINIMUM_CHARACTERS_USERNAME,
  MAXIMUM_CHARACTERS_USERNAME,
  CHECK_USERNAME_DEBOUNCE_WAIT,
  NUMBER_RESULTS_BY_PAGE,
  checkUsernameValidity,
  formatAbsoluteDate,
  permissiveNumberEqual,
  sortWorkspaceList,
  updateTLMUser,
  scrollIntoViewIfNeeded,
  darkenColor,
  lightenColor,
  htmlCodeToDocumentFragment,
  sendGlobalFlashMessage,
  PAGE,
  getAvatarBaseUrl,
  getCoverBaseUrl,
  DATE_FNS_LOCALE,
  getFileDownloadUrl,
  htmlToText,
  tinymceRemove,
  addExternalLinksIcons,
  USER_CALL_STATE
} from './helper.js'

import {
  GROUP_MENTION_TRANSLATION_LIST,
  addClassToMentionsOfUser,
  getInvalidMentionList,
  handleInvalidMentionInComment,
  handleLinksBeforeSave,
  handleMentionsBeforeSave
} from './mentionOrLink.js'

import { TracimComponent } from './tracimComponent.js'
import { CUSTOM_EVENT } from './customEvent.js'
import {
  TLM_ENTITY_TYPE,
  TLM_CORE_EVENT_TYPE,
  TLM_SUB_TYPE
} from './tracimLiveMessage.js'

import {
  LiveMessageManager,
  LIVE_MESSAGE_STATUS,
  LIVE_MESSAGE_ERROR_CODE
} from './LiveMessageManager.js'

import { appContentFactory, TIMELINE_ITEM_COUNT_PER_PAGE } from './appContentFactory.js'

import {
  createFileUpload,
  uploadFile,
  isFileUploadInList,
  isFileUploadInErrorState
} from './fileUpload.js'

import { defaultDebug } from './debug.js'

import AgendaInfo from './component/AgendaInfo/AgendaInfo.jsx'
import { Breadcrumbs } from './component/Breadcrumbs/Breadcrumbs.jsx'

import PopinFixed from './component/PopinFixed/PopinFixed.jsx'
import PopinFixedHeader from './component/PopinFixed/PopinFixedHeader.jsx'
import PopinFixedContent from './component/PopinFixed/PopinFixedContent.jsx'
import PopinFixedRightPart from './component/PopinFixed/PopinFixedRightPart.jsx'
import PopinFixedRightPartContent from './component/PopinFixed/PopinFixedRightPartContent.jsx'

import Avatar, { AVATAR_SIZE } from './component/Avatar/Avatar.jsx'
import Badge from './component/Badge/Badge.jsx'
import Popover from './component/Popover/Popover.jsx'

import Timeline from './component/Timeline/Timeline.jsx'
import CommentArea from './component/Timeline/CommentArea.jsx'
import EditCommentPopup from './component/Timeline/EditCommentPopup.jsx'

import AddFileToUploadButton from './component/Timeline/AddFileToUploadButton.jsx'
import DisplayFileToUpload from './component/Timeline/DisplayFileToUpload.jsx'

import ScrollToBottomWrapper from './component/ScrollToBottomWrapper/ScrollToBottomWrapper.jsx'

import TextAreaApp from './component/Input/TextAreaApp/TextAreaApp.jsx'
import BtnSwitch from './component/Input/BtnSwitch/BtnSwitch.jsx'
import Checkbox from './component/Input/Checkbox.jsx'
import SingleChoiceList from './component/Input/SingleChoiceList/SingleChoiceList.jsx'
import AutoComplete from './component/Input/AutoComplete/AutoComplete.jsx'

import PageWrapper from './component/Layout/PageWrapper.jsx'
import PageTitle from './component/Layout/PageTitle.jsx'
import PageContent from './component/Layout/PageContent.jsx'

import Delimiter from './component/Delimiter/Delimiter.jsx'

import CardPopup from './component/CardPopup/CardPopup.jsx'
import CardPopupCreateContent from './component/CardPopup/CardPopupCreateContent.jsx'

import DropdownMenu from './component/DropdownMenu/DropdownMenu.jsx'

import NewVersionBtn from './component/OptionComponent/NewVersionBtn.jsx'
import ArchiveDeleteContent from './component/OptionComponent/ArchiveDeleteContent.jsx'
import SelectStatus from './component/Input/SelectStatus/SelectStatus.jsx'
import ErrorFlashMessageTemplateHtml from './component/ErrorFlashMessageTemplateHtml/ErrorFlashMessageTemplateHtml.jsx'
import RefreshWarningMessage from './component/RefreshWarningMessage/RefreshWarningMessage.jsx'

import NewMemberForm from './component/NewMemberForm/NewMemberForm.jsx'

import ListItemWrapper from './component/Lists/ListItemWrapper/ListItemWrapper.jsx'
import NoHoverListItem from './component/Lists/NoHoverListItem/NoHoverListItem.jsx'

import ComposedIcon from './component/Icon/ComposedIcon.jsx'

import IconButton from './component/Button/IconButton.jsx'
import GenericButton from './component/Button/GenericButton.jsx'
import TranslateButton from './component/Button/TranslateButton.jsx'

import PromptMessage from './component/PromptMessage/PromptMessage.jsx'

import FileDropzone from './component/FileDropzone/FileDropzone.jsx'
import FileUploadList from './component/FileDropzone/FileUploadList.jsx'

import ShareDownload from './component/ShareDownload/ShareDownload.jsx'
import ShareLink from './component/ShareLink/ShareLink.jsx'

import ProgressBar from './component/ProgressBar/ProgressBar.jsx'

import RadioBtnGroup from './component/Input/RadioBtn/RadioBtn.jsx'
import DateInput from './component/Input/DateInput/DateInput.jsx'

import UserInfo from './component/UserInfo/UserInfo.jsx'
import TextInput from './component/Input/TextInput.jsx'
import DistanceDate from './component/DistanceDate.jsx'
import Icon from './component/Icon/Icon.jsx'

import PopupUploadFile from './container/PopupUploadFile.jsx'
import PopupProgressUpload from './container/PopupProgressUpload.jsx'
import ProfileNavigation from './component/ProfileNavigation/ProfileNavigation.jsx'

import {
  tinymceAutoCompleteHandleInput,
  tinymceAutoCompleteHandleKeyDown,
  tinymceAutoCompleteHandleKeyUp,
  tinymceAutoCompleteHandleClickItem,
  tinymceAutoCompleteHandleSelectionChange
} from './tinymceAutoCompleteHelper.js'

import {
  baseFetch,
  getContentPath,
  putEditContent,
  postNewEmptyContent,
  postNewComment,
  putEditStatus,
  putContentArchived,
  putContentDeleted,
  putContentRestoreArchive,
  putContentRestoreDelete,
  getMyselfKnownMember,
  getUsernameAvailability,
  getReservedUsernames,
  getWorkspaceDetail,
  getWorkspaceMemberList,
  deleteWorkspace,
  getContentTypeList,
  putUserConfiguration,
  getFolderContentList,
  getFolderDetail,
  getFileContent,
  getWorkspaceContentList,
  putFileIsDeleted,
  getFileRevision,
  putFileDescription,
  putMyselfFileRead,
  getContentComment,
  getFileChildContent,
  getContent,
  getWorkspaceContent,
  getHtmlDocTranslated,
  getCommentTranslated,
  getGenericWorkspaceContent,
  getRawFileContent,
  putRawFileContent,
  postRawFileContent
} from './action.async.js'

const customEventReducer = ({ detail: { type, data } }) => {
  switch (type) {
    case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
      i18n.changeLanguage(data)
      break
  }
}

document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, customEventReducer)

export const enTranslation = require('../i18next.scanner/en/translation.json')
export const frTranslation = require('../i18next.scanner/fr/translation.json')
export const ptTranslation = require('../i18next.scanner/pt/translation.json')
export const deTranslation = require('../i18next.scanner/de/translation.json')
export const arTranslation = require('../i18next.scanner/ar/translation.json')

export { default as ConfirmPopup } from './component/ConfirmPopup/ConfirmPopup.jsx'
export { default as HTMLContent } from './component/HTMLContent/HTMLContent.jsx'
export { default as Comment } from './component/Timeline/Comment.jsx'

export { default as SCREEN_SIZE } from './screenSizes.json'
export { removeInteractiveContentFromHTML } from './htmlRemoveInteractivity.js'

export {
  LOCAL_STORAGE_FIELD,
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem
} from './localStorage.js'

export { default as AttachedFile } from './component/AttachedFile/AttachedFile.jsx'
export { default as FilenameWithExtension } from './component/FilenameWithExtension/FilenameWithExtension.jsx'
export { default as EmojiReactions } from './container/EmojiReactions.jsx'
export { default as FavoriteButton, FAVORITE_STATE } from './component/Button/FavoriteButton.jsx'
export { default as ToolBar } from './component/ToolBar/ToolBar.jsx'
export { default as LinkPreview } from './component/LinkPreview/LinkPreview.jsx'
export { default as TagList } from './component/Tags/TagList.jsx'
export { default as Tag } from './component/Tags/Tag.jsx'
export { default as Loading } from './component/Loading/Loading.jsx'
export { default as COLORS } from './colors.js'

export {
  TRANSLATION_STATE,
  handleTranslateComment,
  handleTranslateHtmlContent,
  getTranslationApiErrorMessage,
  getDefaultTranslationState
} from './translation.js'

export {
  AgendaInfo,
  appContentFactory,
  DateInput,
  TIMELINE_ITEM_COUNT_PER_PAGE,
  addRevisionFromTLM,
  AVATAR_SIZE,
  buildContentPathBreadcrumbs,
  CommentArea,
  AddFileToUploadButton,
  DisplayFileToUpload,
  createSpaceTree,
  DropdownMenu,
  EditCommentPopup,
  getContentPath,
  handleInvalidMentionInComment,
  handleLinksBeforeSave,
  naturalCompareLabels,
  ScrollToBottomWrapper,
  sortWorkspaceList,
  TracimComponent,
  addAllResourceI18n,
  handleFetchResult,
  displayDistanceDate,
  convertBackslashNToBr,
  revisionTypeList,
  generateRandomPassword,
  getCurrentContentVersionNumber,
  hasSpaces,
  buildFilePreviewUrl,
  buildHeadTitle,
  splitFilenameExtension,
  removeExtensionOfFilename,
  removeAtInUsername,
  computeProgressionPercentage,
  Breadcrumbs,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedContent,
  PopinFixedRightPart,
  PopinFixedRightPartContent,
  Avatar,
  Badge,
  Timeline,
  TextAreaApp,
  BtnSwitch,
  Checkbox,
  PageWrapper,
  PageTitle,
  PageContent,
  Delimiter,
  CardPopup,
  CardPopupCreateContent,
  NewVersionBtn,
  GenericButton,
  ArchiveDeleteContent,
  SelectStatus,
  ErrorFlashMessageTemplateHtml,
  NewMemberForm,
  CUSTOM_EVENT,
  TLM_ENTITY_TYPE,
  TLM_CORE_EVENT_TYPE,
  TLM_SUB_TYPE,
  BREADCRUMBS_TYPE,
  ROLE,
  ROLE_LIST,
  PROFILE,
  PROFILE_LIST,
  SPACE_TYPE,
  SPACE_TYPE_LIST,
  USER_CALL_STATE,
  ACCESSIBLE_SPACE_TYPE_LIST,
  SUBSCRIPTION_TYPE,
  SUBSCRIPTION_TYPE_LIST,
  FETCH_CONFIG,
  APP_FEATURE_MODE,
  FILE_PREVIEW_STATE,
  IMG_LOAD_STATE,
  displayFileSize,
  parserStringToList,
  checkEmailValidity,
  defaultDebug,
  ListItemWrapper,
  IconButton,
  ComposedIcon,
  PromptMessage,
  FileDropzone,
  FileUploadList,
  ShareLink,
  ShareDownload,
  ProgressBar,
  RadioBtnGroup,
  CONTENT_TYPE,
  CONTENT_NAMESPACE,
  buildTracimLiveMessageEventType,
  RefreshWarningMessage,
  sortTimelineByDate,
  setupCommonRequestHeaders,
  serialize,
  getOrCreateSessionClientToken,
  checkUsernameValidity,
  ALLOWED_CHARACTERS_USERNAME,
  MINIMUM_CHARACTERS_USERNAME,
  MAXIMUM_CHARACTERS_USERNAME,
  NUMBER_RESULTS_BY_PAGE,
  CHECK_USERNAME_DEBOUNCE_WAIT,
  formatAbsoluteDate,
  AutoComplete,
  tinymceAutoCompleteHandleInput,
  tinymceAutoCompleteHandleKeyDown,
  tinymceAutoCompleteHandleKeyUp,
  tinymceAutoCompleteHandleClickItem,
  tinymceAutoCompleteHandleSelectionChange,
  updateTLMUser,
  baseFetch,
  putEditContent,
  postNewEmptyContent,
  postNewComment,
  putEditStatus,
  putContentArchived,
  putContentDeleted,
  putContentRestoreArchive,
  putContentRestoreDelete,
  getMyselfKnownMember,
  getUsernameAvailability,
  getReservedUsernames,
  getWorkspaceDetail,
  getWorkspaceMemberList,
  deleteWorkspace,
  getContentTypeList,
  putUserConfiguration,
  getFolderContentList,
  getFolderDetail,
  getFileContent,
  getWorkspaceContentList,
  putFileIsDeleted,
  getFileRevision,
  putFileDescription,
  putMyselfFileRead,
  getContentComment,
  getFileChildContent,
  addExternalLinksIcons,
  GROUP_MENTION_TRANSLATION_LIST,
  addClassToMentionsOfUser,
  getInvalidMentionList,
  handleMentionsBeforeSave,
  NoHoverListItem,
  permissiveNumberEqual,
  SingleChoiceList,
  UserInfo,
  scrollIntoViewIfNeeded,
  darkenColor,
  lightenColor,
  htmlCodeToDocumentFragment,
  sendGlobalFlashMessage,
  LiveMessageManager,
  LIVE_MESSAGE_STATUS,
  LIVE_MESSAGE_ERROR_CODE,
  TextInput,
  getContent,
  DistanceDate,
  Icon,
  getWorkspaceContent,
  PAGE,
  PopupUploadFile,
  PopupProgressUpload,
  createFileUpload,
  uploadFile,
  isFileUploadInList,
  isFileUploadInErrorState,
  getAvatarBaseUrl,
  ProfileNavigation,
  getCoverBaseUrl,
  TranslateButton,
  getCommentTranslated,
  getHtmlDocTranslated,
  DATE_FNS_LOCALE,
  getFileDownloadUrl,
  getGenericWorkspaceContent,
  htmlToText,
  getRawFileContent,
  putRawFileContent,
  postRawFileContent,
  tinymceRemove,
  Popover,
  getBrowserLang
}
