import i18n from './i18n.js'
import {
  addAllResourceI18n,
  handleFetchResult,
  displayDistanceDate,
  convertBackslashNToBr,
  revisionTypeList,
  generateLocalStorageContentId,
  generateRandomPassword,
  appFeatureCustomEventHandlerShowApp,
  BREADCRUMBS_TYPE,
  FETCH_CONFIG,
  displayFileSize,
  parserStringToList,
  checkEmailValidity
} from './helper.js'
import { CUSTOM_EVENT } from './customEvent.js'

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
import DisplayState from './component/DisplayState/DisplayState.jsx'

import FileDropzone from './component/FileDropzone/FileDropzone.jsx'

import ShareDownload from './component/ShareDownload/ShareDownload.jsx'
import ShareLink from './component/ShareLink/ShareLink.jsx'

import ProgressBar from './component/ProgressBar/ProgressBar.jsx'

import RadioBtnGroup from './component/Input/RadioBtn/RadioBtn.jsx'

const customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
  switch (type) {
    case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
      i18n.changeLanguage(data)
      break
    default: break
  }
}

document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, customEventReducer)

export const enTranslation = require('../i18next.scanner/en/translation.json')
export const frTranslation = require('../i18next.scanner/fr/translation.json')

export {
  addAllResourceI18n,
  handleFetchResult,
  displayDistanceDate,
  convertBackslashNToBr,
  revisionTypeList,
  generateLocalStorageContentId,
  generateRandomPassword,
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
  ArchiveDeleteContent,
  SelectStatus,
  ErrorFlashMessageTemplateHtml,
  NewMemberForm,
  CUSTOM_EVENT,
  BREADCRUMBS_TYPE,
  FETCH_CONFIG,
  displayFileSize,
  parserStringToList,
  checkEmailValidity,
  defaultDebug,
  appFeatureCustomEventHandlerShowApp,
  ListItemWrapper,
  IconButton,
  ComposedIcon,
  DisplayState,
  FileDropzone,
  ShareLink,
  ShareDownload,
  ProgressBar,
  RadioBtnGroup
}
