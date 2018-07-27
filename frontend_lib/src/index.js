import { libAddAllResourceI18n, libHandleFetchResult } from './helper.js'

// fr and en are deprecated
import fr from './translate/fr.js'
import en from './translate/en.js'

import libPopinFixed from './component/PopinFixed/PopinFixed.jsx'
import libPopinFixedHeader from './component/PopinFixed/PopinFixedHeader.jsx'
import libPopinFixedOption from './component/PopinFixed/PopinFixedOption.jsx'
import libPopinFixedContent from './component/PopinFixed/PopinFixedContent.jsx'

import libTimeline from './component/Timeline/Timeline.jsx'

import libTextAreaApp from './component/Input/TextAreaApp/TextAreaApp.jsx'
import libBtnSwitch from './component/Input/BtnSwitch/BtnSwitch.jsx'

import libDelimiter from './component/Delimiter/Delimiter.jsx'

import libCardPopup from './component/CardPopup/CardPopup.jsx'
import libCardPopupCreateContent from './component/CardPopup/CardPopupCreateContent.jsx'

import libNewVersionBtn from './component/OptionComponent/NewVersionBtn.jsx'
import libArchiveDeleteContent from './component/OptionComponent/ArchiveDeleteContent.jsx'
import libSelectStatus from './component/Input/SelectStatus/SelectStatus.jsx'

export const langFr = fr
export const langEn = en

export const addAllResourceI18n = libAddAllResourceI18n

export const handleFetchResult = libHandleFetchResult

export const PopinFixed = libPopinFixed
export const PopinFixedHeader = libPopinFixedHeader
export const PopinFixedOption = libPopinFixedOption
export const PopinFixedContent = libPopinFixedContent

export const Timeline = libTimeline

export const TextAreaApp = libTextAreaApp
export const BtnSwitch = libBtnSwitch

export const Delimiter = libDelimiter

export const CardPopup = libCardPopup
export const CardPopupCreateContent = libCardPopupCreateContent

export const NewVersionBtn = libNewVersionBtn
export const ArchiveDeleteContent = libArchiveDeleteContent
export const SelectStatus = libSelectStatus
