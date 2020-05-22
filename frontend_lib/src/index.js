import i18n from './i18n.js'
import {
  addAllResourceI18n,
  handleFetchResult,
  displayDistanceDate,
  convertBackslashNToBr,
  revisionTypeList,
  generateLocalStorageContentId,
  generateRandomPassword,
  BREADCRUMBS_TYPE,
  ROLE,
  ROLE_LIST,
  PROFILE,
  PROFILE_LIST,
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
  buildHeadTitle
} from './helper.js'
import { TracimComponent } from './tracimComponent.js'
import { CUSTOM_EVENT } from './customEvent.js'
import {
  TLM_ENTITY_TYPE,
  TLM_CORE_EVENT_TYPE
} from './tracimLiveMessage.js'

import { appContentFactory } from './appContentFactory.js'

import { defaultDebug } from './debug.js'

import { Breadcrumbs } from './component/Breadcrumbs/Breadcrumbs.jsx'

import PopinFixed from './component/PopinFixed/PopinFixed.jsx'
import PopinFixedHeader from './component/PopinFixed/PopinFixedHeader.jsx'
import PopinFixedOption from './component/PopinFixed/PopinFixedOption.jsx'
import PopinFixedContent from './component/PopinFixed/PopinFixedContent.jsx'
import PopinFixedRightPart from './component/PopinFixed/PopinFixedRightPart.jsx'

import Avatar from './component/Avatar/Avatar.jsx'
import Badge from './component/Badge/Badge.jsx'

import Timeline from './component/Timeline/Timeline.jsx'

import TextAreaApp from './component/Input/TextAreaApp/TextAreaApp.jsx'
import BtnSwitch from './component/Input/BtnSwitch/BtnSwitch.jsx'
import Checkbox from './component/Input/Checkbox.jsx'

import PageWrapper from './component/Layout/PageWrapper.jsx'
import PageTitle from './component/Layout/PageTitle.jsx'
import PageContent from './component/Layout/PageContent.jsx'

import Delimiter from './component/Delimiter/Delimiter.jsx'

import CardPopup from './component/CardPopup/CardPopup.jsx'
import CardPopupCreateContent from './component/CardPopup/CardPopupCreateContent.jsx'

import NewVersionBtn from './component/OptionComponent/NewVersionBtn.jsx'
import ArchiveDeleteContent from './component/OptionComponent/ArchiveDeleteContent.jsx'
import SelectStatus from './component/Input/SelectStatus/SelectStatus.jsx'
import ErrorFlashMessageTemplateHtml from './component/ErrorFlashMessageTemplateHtml/ErrorFlashMessageTemplateHtml.jsx'

import NewMemberForm from './component/NewMemberForm/NewMemberForm.jsx'

import ListItemWrapper from './component/ListItemWrapper/ListItemWrapper.jsx'

import IconButton from './component/Button/IconButton.jsx'
import ComposedIcon from './component/Icon/ComposedIcon.jsx'

import GenericButton from './component/Button/GenericButton.jsx'

import DisplayState from './component/DisplayState/DisplayState.jsx'

import FileDropzone from './component/FileDropzone/FileDropzone.jsx'
import FileUploadList from './component/FileDropzone/FileUploadList.jsx'

import ShareDownload from './component/ShareDownload/ShareDownload.jsx'
import ShareLink from './component/ShareLink/ShareLink.jsx'

import ProgressBar from './component/ProgressBar/ProgressBar.jsx'

import RadioBtnGroup from './component/Input/RadioBtn/RadioBtn.jsx'

import { commentList as fixtureCommentList } from '../test/fixture/contentCommentList.js'
import { revisionList as fixtureRevisionList } from '../test/fixture/contentRevisionList.js'

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

export {
  appContentFactory,
  TracimComponent,
  addAllResourceI18n,
  handleFetchResult,
  displayDistanceDate,
  convertBackslashNToBr,
  revisionTypeList,
  generateLocalStorageContentId,
  generateRandomPassword,
  buildFilePreviewUrl,
  buildHeadTitle,
  removeExtensionOfFilename,
  computeProgressionPercentage,
  Breadcrumbs,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  PopinFixedRightPart,
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
  BREADCRUMBS_TYPE,
  ROLE,
  ROLE_LIST,
  PROFILE,
  PROFILE_LIST,
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
  DisplayState,
  FileDropzone,
  FileUploadList,
  ShareLink,
  ShareDownload,
  ProgressBar,
  RadioBtnGroup,
  fixtureCommentList,
  fixtureRevisionList
}
