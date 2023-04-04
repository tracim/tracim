import i18n, { getBrowserLang } from './i18n.js'
import {
  ACCESSIBLE_SPACE_TYPE_LIST,
  ALLOWED_CHARACTERS_USERNAME,
  APP_FEATURE_MODE,
  BREADCRUMBS_TYPE,
  CHECK_USERNAME_DEBOUNCE_WAIT,
  COLLABORA_EXTENSIONS,
  CONTENT_NAMESPACE,
  CONTENT_TYPE,
  DATE_FNS_LOCALE,
  FETCH_CONFIG,
  FILE_PREVIEW_STATE,
  IMG_LOAD_STATE,
  MAXIMUM_CHARACTERS_USERNAME,
  MINIMUM_CHARACTERS_USERNAME,
  NUMBER_RESULTS_BY_PAGE,
  PAGE,
  PROFILE_LIST,
  PROFILE,
  ROLE_LIST,
  ROLE,
  SPACE_TYPE_LIST,
  SPACE_TYPE,
  STATUSES,
  SUBSCRIPTION_TYPE_LIST,
  SUBSCRIPTION_TYPE,
  TIMELINE_TYPE,
  USER_CALL_STATE,
  addAllResourceI18n,
  addExternalLinksIcons,
  addRevisionFromTLM,
  buildContentPathBreadcrumbs,
  buildFilePreviewUrl,
  buildHeadTitle,
  buildTracimLiveMessageEventType,
  checkEmailValidity,
  checkUsernameValidity,
  computeProgressionPercentage,
  createSpaceTree,
  darkenColor,
  displayDistanceDate,
  displayFileSize,
  formatAbsoluteDate,
  generateRandomPassword,
  getAvatarBaseUrl,
  getCoverBaseUrl,
  getCurrentContentVersionNumber,
  getFileDownloadUrl,
  getOrCreateSessionClientToken,
  getRevisionTypeLabel,
  handleClickCopyLink,
  handleFetchResult,
  hasSpaces,
  htmlToText,
  lightenColor,
  parserStringToList,
  permissiveNumberEqual,
  removeAtInUsername,
  removeExtensionOfFilename,
  revisionTypeList,
  scrollIntoViewIfNeeded,
  sendGlobalFlashMessage,
  serialize,
  setupCommonRequestHeaders,
  splitFilenameExtension,
  stringIncludes,
  updateTLMUser
} from './helper.js'

import {
  SORT_BY,
  SORT_ORDER,
  putFoldersAtListBeginning,
  sortListBy,
  sortListByMultipleCriteria,
  sortTimelineByDate
} from './sortListHelper.js'

import {
  DEFAULT_ROLE_LIST,
  GROUP_MENTION_TRANSLATION_LIST,
  addClassToMentionsOfUser,
  getInvalidMentionList,
  handleLinksBeforeSave,
  handleMentionsBeforeSave,
  replaceHTMLElementWithMention,
  searchContentAndReplaceWithTag,
  searchMentionAndReplaceWithTag
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
import EmptyListMessage from './component/EmptyListMessage/EmptyListMessage.jsx'
import TitleListHeader from './component/Lists/ListHeader/TitleListHeader.jsx'

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

import TinyEditor from './component/TinyEditor/TinyEditor.jsx'

import ScrollToBottomWrapper from './component/ScrollToBottomWrapper/ScrollToBottomWrapper.jsx'

import BtnSwitch from './component/Input/BtnSwitch/BtnSwitch.jsx'
import Checkbox from './component/Input/Checkbox.jsx'
import SingleChoiceList from './component/Input/SingleChoiceList/SingleChoiceList.jsx'

import PageWrapper from './component/Layout/PageWrapper.jsx'
import PageTitle from './component/Layout/PageTitle.jsx'
import PageContent from './component/Layout/PageContent.jsx'

import TimedEvent from './component/TimedEvent/TimedEvent.jsx'

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
import FilterBar from './component/FilterBar/FilterBar.jsx'

import PopupUploadFile from './container/PopupUploadFile.jsx'
import PopupProgressUpload from './container/PopupProgressUpload.jsx'
import ProfileNavigation from './component/ProfileNavigation/ProfileNavigation.jsx'

import ToDoManagement from './component/ToDo/ToDoManagement.jsx'
import NewToDo from './component/ToDo/NewToDo.jsx'
import ToDoItem from './component/ToDo/ToDoItem.jsx'

import ContentType from './component/ContentType/ContentType.jsx'

import {
  baseFetch,
  deleteToDo,
  deleteWorkspace,
  getComment,
  getCommentTranslated,
  getContent,
  getContentComment,
  getContentPath,
  getContentTypeList,
  getFileChildContent,
  getFileContent,
  getFileRevision,
  getFileRevisionPreviewInfo,
  getFolderContentList,
  getFolderDetail,
  getGenericWorkspaceContent,
  getHtmlDocTranslated,
  getMyselfKnownMember,
  getRawFileContent,
  getReservedUsernames,
  getSpaceContent,
  getSpaceMemberFromId,
  getSpaceMemberList,
  getToDo,
  getToDoListForUser,
  getUsernameAvailability,
  getWorkspaceContentList,
  getWorkspaceDetail,
  postNewComment,
  postNewEmptyContent,
  postRawFileContent,
  putContentArchived,
  putContentDeleted,
  putContentRestoreArchive,
  putContentRestoreDelete,
  putEditContent,
  putEditStatus,
  putFileDescription,
  putFileIsDeleted,
  putMyselfFileRead,
  putRawFileContent,
  putToDo,
  putUserConfiguration
} from './action.async.js'

export {
  usePublishLifecycle,
  withUsePublishLifecycle
} from './customHooks.jsx'

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
export const esTranslation = require('../i18next.scanner/es/translation.json')
export const nbNOTranslation = require('../i18next.scanner/nb_NO/translation.json')

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
export { default as FilenameWithBadges } from './component/FilenameWithBadges/FilenameWithBadges.jsx'
export { default as EmojiReactions } from './container/EmojiReactions.jsx'
export { default as FavoriteButton, FAVORITE_STATE } from './component/Button/FavoriteButton.jsx'
export { default as ToolBar } from './component/ToolBar/ToolBar.jsx'
export { default as LinkPreview } from './component/LinkPreview/LinkPreview.jsx'
export { default as TagList } from './component/Tags/TagList.jsx'
export { default as Tag } from './component/Tags/Tag.jsx'
export { default as Loading } from './component/Loading/Loading.jsx'
export { default as COLORS } from './colors.js'

export { default as tracimTableLib } from './TracimTableLib/tracimTableLib.js'

export {
  TRANSLATION_STATE,
  handleTranslateComment,
  handleTranslateHtmlContent,
  getTranslationApiErrorMessage,
  getDefaultTranslationState
} from './translation.js'

export {
  ACCESSIBLE_SPACE_TYPE_LIST,
  ALLOWED_CHARACTERS_USERNAME,
  APP_FEATURE_MODE,
  AVATAR_SIZE,
  BREADCRUMBS_TYPE,
  CHECK_USERNAME_DEBOUNCE_WAIT,
  COLLABORA_EXTENSIONS,
  CONTENT_NAMESPACE,
  CONTENT_TYPE,
  CUSTOM_EVENT,
  DATE_FNS_LOCALE,
  DEFAULT_ROLE_LIST,
  FETCH_CONFIG,
  FILE_PREVIEW_STATE,
  GROUP_MENTION_TRANSLATION_LIST,
  IMG_LOAD_STATE,
  LIVE_MESSAGE_ERROR_CODE,
  LIVE_MESSAGE_STATUS,
  MAXIMUM_CHARACTERS_USERNAME,
  MINIMUM_CHARACTERS_USERNAME,
  NUMBER_RESULTS_BY_PAGE,
  PAGE,
  PROFILE_LIST,
  PROFILE,
  ROLE_LIST,
  ROLE,
  SORT_BY,
  SORT_ORDER,
  SPACE_TYPE_LIST,
  SPACE_TYPE,
  STATUSES,
  SUBSCRIPTION_TYPE_LIST,
  SUBSCRIPTION_TYPE,
  TIMELINE_ITEM_COUNT_PER_PAGE,
  TIMELINE_TYPE,
  TLM_CORE_EVENT_TYPE,
  TLM_ENTITY_TYPE,
  TLM_SUB_TYPE,
  USER_CALL_STATE,
  AddFileToUploadButton,
  AgendaInfo,
  ArchiveDeleteContent,
  Avatar,
  Badge,
  Breadcrumbs,
  BtnSwitch,
  CardPopup,
  CardPopupCreateContent,
  Checkbox,
  CommentArea,
  ComposedIcon,
  ContentType,
  DateInput,
  Delimiter,
  DisplayFileToUpload,
  DistanceDate,
  DropdownMenu,
  EditCommentPopup,
  EmptyListMessage,
  ErrorFlashMessageTemplateHtml,
  FileDropzone,
  FileUploadList,
  FilterBar,
  GenericButton,
  Icon,
  IconButton,
  ListItemWrapper,
  LiveMessageManager,
  NewMemberForm,
  NewToDo,
  NewVersionBtn,
  NoHoverListItem,
  PageContent,
  PageTitle,
  PageWrapper,
  PopinFixed,
  PopinFixedContent,
  PopinFixedHeader,
  PopinFixedRightPart,
  PopinFixedRightPartContent,
  Popover,
  PopupProgressUpload,
  PopupUploadFile,
  ProfileNavigation,
  ProgressBar,
  PromptMessage,
  RadioBtnGroup,
  RefreshWarningMessage,
  ScrollToBottomWrapper,
  SelectStatus,
  ShareDownload,
  ShareLink,
  SingleChoiceList,
  TextInput,
  TimedEvent,
  Timeline,
  TinyEditor,
  TitleListHeader,
  ToDoItem,
  ToDoManagement,
  TracimComponent,
  TranslateButton,
  UserInfo,
  addAllResourceI18n,
  addClassToMentionsOfUser,
  addExternalLinksIcons,
  addRevisionFromTLM,
  appContentFactory,
  baseFetch,
  buildContentPathBreadcrumbs,
  buildFilePreviewUrl,
  buildHeadTitle,
  buildTracimLiveMessageEventType,
  checkEmailValidity,
  checkUsernameValidity,
  computeProgressionPercentage,
  createFileUpload,
  createSpaceTree,
  darkenColor,
  defaultDebug,
  deleteToDo,
  deleteWorkspace,
  displayDistanceDate,
  displayFileSize,
  formatAbsoluteDate,
  generateRandomPassword,
  getAvatarBaseUrl,
  getBrowserLang,
  getComment,
  getCommentTranslated,
  getContent,
  getContentComment,
  getContentPath,
  getContentTypeList,
  getCoverBaseUrl,
  getCurrentContentVersionNumber,
  getFileChildContent,
  getFileContent,
  getFileDownloadUrl,
  getFileRevision,
  getFileRevisionPreviewInfo,
  getFolderContentList,
  getFolderDetail,
  getGenericWorkspaceContent,
  getHtmlDocTranslated,
  getInvalidMentionList,
  getMyselfKnownMember,
  getOrCreateSessionClientToken,
  getRawFileContent,
  getReservedUsernames,
  getRevisionTypeLabel,
  getSpaceContent,
  getSpaceMemberFromId,
  getSpaceMemberList,
  getToDo,
  getToDoListForUser,
  getUsernameAvailability,
  getWorkspaceContentList,
  getWorkspaceDetail,
  handleClickCopyLink,
  handleFetchResult,
  handleLinksBeforeSave,
  handleMentionsBeforeSave,
  hasSpaces,
  htmlToText,
  isFileUploadInErrorState,
  isFileUploadInList,
  lightenColor,
  parserStringToList,
  permissiveNumberEqual,
  postNewComment,
  postNewEmptyContent,
  postRawFileContent,
  putContentArchived,
  putContentDeleted,
  putContentRestoreArchive,
  putContentRestoreDelete,
  putEditContent,
  putEditStatus,
  putFileDescription,
  putFileIsDeleted,
  putFoldersAtListBeginning,
  putMyselfFileRead,
  putRawFileContent,
  putToDo,
  putUserConfiguration,
  removeAtInUsername,
  removeExtensionOfFilename,
  replaceHTMLElementWithMention,
  revisionTypeList,
  scrollIntoViewIfNeeded,
  searchContentAndReplaceWithTag,
  searchMentionAndReplaceWithTag,
  sendGlobalFlashMessage,
  serialize,
  setupCommonRequestHeaders,
  sortListBy,
  sortListByMultipleCriteria,
  sortTimelineByDate,
  splitFilenameExtension,
  stringIncludes,
  updateTLMUser,
  uploadFile
}
