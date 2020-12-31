import i18n from './i18n.js'
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
  removeExtensionOfFilename,
  computeProgressionPercentage,
  buildHeadTitle,
  CONTENT_TYPE,
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
  updateTLMAuthor,
  scrollIntoViewIfNeeded,
  darkenColor,
  lightenColor,
  PAGE
} from './helper.js'
import {
  addClassToMentionsOfUser,
  getInvalidMentionList,
  handleInvalidMentionInComment,
  handleMentionsBeforeSave
} from './mention.js'
import { TracimComponent } from './tracimComponent.js'
import { CUSTOM_EVENT } from './customEvent.js'
import {
  TLM_ENTITY_TYPE,
  TLM_CORE_EVENT_TYPE,
  TLM_SUB_TYPE
} from './tracimLiveMessage.js'

import {
  LiveMessageManager,
  LIVE_MESSAGE_STATUS
} from './LiveMessageManager.js'

import { appContentFactory } from './appContentFactory.js'

import { defaultDebug } from './debug.js'

import { Breadcrumbs } from './component/Breadcrumbs/Breadcrumbs.jsx'

import PopinFixed from './component/PopinFixed/PopinFixed.jsx'
import PopinFixedHeader from './component/PopinFixed/PopinFixedHeader.jsx'
import PopinFixedOption from './component/PopinFixed/PopinFixedOption.jsx'
import PopinFixedContent from './component/PopinFixed/PopinFixedContent.jsx'
import PopinFixedRightPart from './component/PopinFixed/PopinFixedRightPart.jsx'
import PopinFixedRightPartContent from './component/PopinFixed/PopinFixedRightPartContent.jsx'

import Avatar, { AVATAR_SIZE } from './component/Avatar/Avatar.jsx'
import Badge from './component/Badge/Badge.jsx'

import Timeline from './component/Timeline/Timeline.jsx'

import TextAreaApp from './component/Input/TextAreaApp/TextAreaApp.jsx'
import BtnSwitch from './component/Input/BtnSwitch/BtnSwitch.jsx'
import Checkbox from './component/Input/Checkbox.jsx'
import SingleChoiceList from './component/Input/SingleChoiceList/SingleChoiceList.jsx'
import MentionAutoComplete from './component/Input/MentionAutoComplete/MentionAutoComplete.jsx'

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

import IconButton from './component/Button/IconButton.jsx'
import ComposedIcon from './component/Icon/ComposedIcon.jsx'

import GenericButton from './component/Button/GenericButton.jsx'

import PromptMessage from './component/PromptMessage/PromptMessage.jsx'

import FileDropzone from './component/FileDropzone/FileDropzone.jsx'
import FileUploadList from './component/FileDropzone/FileUploadList.jsx'

import ShareDownload from './component/ShareDownload/ShareDownload.jsx'
import ShareLink from './component/ShareLink/ShareLink.jsx'

import ProgressBar from './component/ProgressBar/ProgressBar.jsx'

import RadioBtnGroup from './component/Input/RadioBtn/RadioBtn.jsx'

import UserInfo from './component/UserInfo/UserInfo.jsx'
import TextInput from './component/Input/TextInput.jsx'
import DistanceDate from './component/DistanceDate.jsx'
import Icon from './component/Icon/Icon.jsx'

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
  putFileContent,
  putMyselfFileRead,
  getContentComment,
  getContent,
  getWorkspaceContent
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

export { default as ConfirmPopup } from './component/ConfirmPopup/ConfirmPopup.jsx'
export { default as HTMLContent } from './component/HTMLContent/HTMLContent.jsx'

export { default as SCREEN_SIZE } from './screenSizes.json'
export { removeInteractiveContentFromHTML } from './htmlRemoveInteractivity.js'

export {
  LOCAL_STORAGE_FIELD,
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem
} from './localStorage.js'

export {
  appContentFactory,
  addRevisionFromTLM,
  AVATAR_SIZE,
  buildContentPathBreadcrumbs,
  createSpaceTree,
  DropdownMenu,
  getContentPath,
  handleInvalidMentionInComment,
  naturalCompareLabels,
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
  removeExtensionOfFilename,
  removeAtInUsername,
  computeProgressionPercentage,
  Breadcrumbs,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
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
  MentionAutoComplete,
  tinymceAutoCompleteHandleInput,
  tinymceAutoCompleteHandleKeyDown,
  tinymceAutoCompleteHandleKeyUp,
  tinymceAutoCompleteHandleClickItem,
  tinymceAutoCompleteHandleSelectionChange,
  updateTLMAuthor,
  baseFetch,
  putEditContent,
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
  putFileContent,
  putMyselfFileRead,
  getContentComment,
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
  LiveMessageManager,
  LIVE_MESSAGE_STATUS,
  TextInput,
  getContent,
  DistanceDate,
  Icon,
  getWorkspaceContent,
  PAGE
}
