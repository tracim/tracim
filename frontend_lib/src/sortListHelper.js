import { STATUSES, naturalCompare, CONTENT_TYPE } from './helper.js'
import { isAfter } from 'date-fns'

// GIULIA do unit tests

// GIULIA need documentation
export const SORT_BY = {
  CONTENT_TYPE: 'contentType',
  CREATION_DATE: 'created',
  ID: 'id',
  LABEL: 'label',
  MODIFICATION_DATE: 'modified',
  PUBLIC_NAME: 'publicName',
  SEARCH_ORDER: 'searchOrder',
  STATUS: 'status'
}

/*
  INFO - GB - 2022-11-17 -
    Ascending means smallest to largest, 0 to 9 or A to Z
    Descending means largest to smallest, 9 to 0 or Z to A
*/
export const SORT_ORDER = {
  ASCENDING: 'ascending',
  DESCENDING: 'descending'
}

// GIULIA need documentation
export const sortListBy = (list, criteria, order = SORT_ORDER.ASCENDING, lang = 'en') => {
  let sortedList = list
  switch (criteria) {
    case SORT_BY.CONTENT_TYPE:
      sortedList = sortByContentType(list, lang)
      break
    case SORT_BY.CREATION_DATE:
      sortedList = sortByCreationDate(list)
      break
    case SORT_BY.ID:
      sortedList = sortById(list)
      break
    case SORT_BY.LABEL:
      sortedList = sortByLabel(list, lang)
      break
    case SORT_BY.MODIFICATION_DATE:
      sortedList = sortByModificationDate(list)
      break
    case SORT_BY.PUBLIC_NAME:
      sortedList = sortByPublicName(list, lang) // GIULIA frontend/src/component/Dashboard/MemberList.jsx
      break
    case SORT_BY.STATUS:
      sortedList = sortByStatus(list, lang)
      break
    default:
      break
  }
  return order === SORT_ORDER.ASCENDING
    ? sortedList
    : sortedList.reverse()
}

// GIULIA need documentation
export const sortListByMultipleCriterias = (listToSort, criteriaList, order = SORT_ORDER.ASCENDING, lang = 'en') => {
  if (criteriaList.length === 1) return sortListBy(listToSort, criteriaList[0], order, lang)
  else return sortListByMultipleCriterias(
    sortListBy(listToSort, criteriaList[criteriaList.length - 1], order),
    criteriaList.slice(0, -1),
    order,
    lang
  )
}

// GIULIA need documentation, verify "contentType"
const sortByContentType = (list, lang) => {
  return list.sort((a, b) => {
    const aContentType = a.contentType || a.type || a.content_type
    const bContentType = b.contentType || b.type || b.content_type

    const contentTypeOrder = [
      CONTENT_TYPE.FOLDER,
      CONTENT_TYPE.HTML_DOCUMENT,
      CONTENT_TYPE.FILE,
      CONTENT_TYPE.KANBAN,
      CONTENT_TYPE.THREAD
    ]

    const aContentTypeIndex = contentTypeOrder.indexOf(aContentType)
    const bContentTypeIndex = contentTypeOrder.indexOf(bContentType)

    if (aContentTypeIndex !== -1 && bContentTypeIndex !== -1) return aContentTypeIndex - bContentTypeIndex
    else return compareStrings(aContentType, bContentType, lang)
  })
}

const sortByCreationDate = (list) => {
  return list.sort((a, b) => {
    const aCreationDate = a.created_raw || a.created
    const bCreationDate = b.created_raw || b.created
    if (aCreationDate < bCreationDate) return 1
    if (aCreationDate > bCreationDate) return -1
    else return 0
  })
}

const sortById = (list) => {
  return list.sort((a, b) => {
    if (a.id < b.id) return 1
    if (a.id > b.id) return -1
    else return 0
  })
}

const sortByLabel = (list, lang) => {
  return list.sort((a, b) => compareStrings(a.label, b.label, lang))
}

const sortByModificationDate = (list) => {
  return list.sort((a, b) => {
    if (a.modified < b.modified) return 1
    if (a.modified > b.modified) return -1
    else return 0
  })
}

const sortByPublicName = (list, lang) => {
  return list.sort((a, b) => {
    const aPublicName = a.publicName || a.public_name
    const bPublicName = b.publicName || b.public_name

    return compareStrings(aPublicName, bPublicName, lang)
  })
}

// GIULIA need documentation
const sortByStatus = (list, lang) => {
  return list.sort((a, b) => {
    const aStatus = a.status || a.statusSlug
    const bStatus = b.status || b.statusSlug

    const statusOrder = [STATUSES.OPEN, STATUSES.VALIDATED, STATUSES.CANCELLED, STATUSES.DEPRECATED]

    const aStatusIndex = statusOrder.indexOf(aStatus)
    const bStatusIndex = statusOrder.indexOf(bStatus)

    if (aStatusIndex !== -1 && bStatusIndex !== -1) return (aStatusIndex - bStatusIndex)
    else return compareStrings(aStatus, bStatus, lang)
  })
}

const compareStrings = (a, b, lang) => {
  const locale = lang ? lang.replaceAll('_', '-') : undefined
  const stringA = a || ''
  const stringB = b || ''
  return stringA.localeCompare(stringB, locale, { numeric: true })
}

export const putFoldersAtListBeginning = (list) => {
  return list.sort((a, b) => {
    if (a.type === CONTENT_TYPE.FOLDER && b.type !== CONTENT_TYPE.FOLDER) return -1
    if (b.type === CONTENT_TYPE.FOLDER && a.type !== CONTENT_TYPE.FOLDER) return 1
    return 0
  })
}

// GIULIA replace these functions
const getSpaceId = (space) => space.workspace_id || space.id
const naturalCompareLabels = (itemA, itemB, lang) => {
  // 2020-09-04 - RJ - WARNING. Option ignorePunctuation is seducing but makes the sort unstable.
  return naturalCompare(itemA, itemB, lang, 'label')
}
export const sortWorkspaceList = (workspaceList, lang) => {
  return workspaceList.sort((a, b) => {
    let res = naturalCompareLabels(a, b, lang)
    if (!res) {
      res = getSpaceId(a) - getSpaceId(b)
    }
    return res
  })
}

export const sortTimelineByDate = (timeline) => {
  return timeline.sort((a, b) => {
    // INFO - GB - 2021-12-07 - since we don't have the millisecond from backend, we can
    // have contents created at the same second. So we sort on revision_id for revision,
    // content_id for comments and we choose revision over comments if we have to sort between both.
    if (a.created_raw === b.created_raw) {
      if (a.revision_id && b.revision_id) return parseInt(a.revision_id) - parseInt(b.revision_id)
      if (!a.revision_id && !b.revision_id) return parseInt(a.content_id) - parseInt(b.content_id)
      else return a.revision_id ? -1 : 1
    }
    return isAfter(new Date(a.created_raw), new Date(b.created_raw)) ? 1 : -1
  })
}
