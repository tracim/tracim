import {
  CONTENT_TYPE,
  STATUSES
} from './helper.js'
import { isAfter } from 'date-fns'

export const SORT_BY = {
  CONTENT_TYPE: 'contentType',
  CREATION_DATE: 'created',
  DESCRIPTION: 'description',
  EMAIL: 'email',
  ID: 'id',
  LABEL: 'label',
  MODIFICATION_DATE: 'modified',
  NUMBER_OF_MEMBERS: 'numberOfMembers',
  PUBLIC_NAME: 'publicName',
  ROLE: 'role',
  SPACE_TYPE: 'spaceType',
  STATUS: 'status',
  USERNAME: 'username'
}

// INFO - GB - 2022-11-17 -
// Ascending means smallest to largest, 0 to 9 or A to Z
// Descending means largest to smallest, 9 to 0 or Z to A
export const SORT_ORDER = {
  ASCENDING: 'ascending',
  DESCENDING: 'descending'
}

/**
 * Sorts the list according to the criterion and order given.
 * @param {Array} list The list to be sorted.
 * @param {Enum <'SORT_BY'>} criterion
 * The criterion that will be used to sort. It must be one of the options of the SORT_BY object found in the frontend_lib/src/sortListHelper.js file.
 * @param {Enum <'SORT_ORDER'>} order
 * (Optionnal) The order that the list will be sorte. It must be one of the options of the SORT_ORDER object
 * found in the frontend_lib/src/sortListHelper.js file. The default value is SORT_ORDER.ASCENDING.
 * @param {String} lang (Optionnal) The language that will be used as the basis for alphabetical order. The default value is 'en'.
 * @returns {Array} The list sorted.
 */
export const sortListBy = (list, criterion, order = SORT_ORDER.ASCENDING, lang = 'en') => {
  const sortedList = sortListByOneCriterion(sortById(list), criterion, lang)
  return order === SORT_ORDER.ASCENDING
    ? sortedList
    : sortedList.reverse()
}

const sortListByOneCriterion = (list, criterion, lang) => {
  let sortedList = list
  switch (criterion) {
    case SORT_BY.CONTENT_TYPE:
      sortedList = sortByContentType(list, lang)
      break
    case SORT_BY.CREATION_DATE:
      sortedList = sortByCreationDate(list)
      break
    case SORT_BY.DESCRIPTION:
      sortedList = sortByDescription(list, lang)
      break
    case SORT_BY.EMAIL:
      sortedList = sortByEmail(list, lang)
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
    case SORT_BY.NUMBER_OF_MEMBERS:
      sortedList = sortByNumberOfMembers(list)
      break
    case SORT_BY.PUBLIC_NAME:
      sortedList = sortByPublicName(list, lang)
      break
    case SORT_BY.ROLE:
      sortedList = sortByRole(list, lang)
      break
    case SORT_BY.SPACE_TYPE:
      sortedList = sortBySpaceType(list, lang)
      break
    case SORT_BY.STATUS:
      sortedList = sortByStatus(list, lang)
      break
    case SORT_BY.USERNAME:
      sortedList = sortByUsername(list, lang)
      break
    default:
      break
  }
  return sortedList
}

/**
 * Sorts the list according to all the criteria and order given.
 * @param {Array} listToSort The list to be sorted.
 * @param {Array<Enum <'SORT_BY'>>} criteriaList
 * The list of criteria that will be used to sort. It must be one of the options of the SORT_BY object found in the
 * frontend_lib/src/sortListHelper.js file. The most important criterion should be first on the list and the least last.
 * @param {Enum <'SORT_ORDER'>} order
 * (Optionnal) The order that the list will be sorte. It must be one of the options of the SORT_ORDER object
 * found in the frontend_lib/src/sortListHelper.js file. The default value is SORT_ORDER.ASCENDING.
 * @param {String} lang (Optionnal) The language that will be used as the basis for alphabetical order. The default value is 'en'.
 * @returns {Array} The list sorted.
 */
export const sortListByMultipleCriteria = (listToSort, criteriaList, order = SORT_ORDER.ASCENDING, lang = 'en') => {
  if (criteriaList.length === 1) {
    const sortedList = sortListByOneCriterion(listToSort, criteriaList[0], lang)
    return order === SORT_ORDER.ASCENDING
      ? sortedList
      : sortedList.reverse()
  } else {
    return sortListByMultipleCriteria(
      sortListByOneCriterion(listToSort, criteriaList[criteriaList.length - 1], lang),
      criteriaList.slice(0, -1),
      order,
      lang
    )
  }
}

const sortByContentType = (list, lang) => {
  return list.sort((a, b) => {
    const aContentType = a.contentType || a.type || a.content_type || a.originalType
    const bContentType = b.contentType || b.type || b.content_type || b.originalType

    return compareStrings(aContentType, bContentType, lang)
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

const sortByDescription = (list, lang) => {
  return list.sort((a, b) => compareStrings(a.description, b.description, lang))
}

const sortByEmail = (list, lang) => {
  return list.sort((a, b) => compareStrings(a.email, b.email, lang))
}

const sortById = (list) => {
  return list.sort((a, b) => {
    const aId = a.id || a.content_id || a.contentId || a.workspace_id || a.user_id
    const bId = b.id || b.content_id || b.contentId || b.workspace_id || b.user_id

    if (aId > bId) return 1
    if (aId < bId) return -1
    else return 0
  })
}

const sortByLabel = (list, lang) => {
  return list.sort((a, b) => {
    const aLabel = a.label || a.originalLabel
    const bLabel = b.label || b.originalLabel

    return compareStrings(aLabel, bLabel, lang)
  })
}

const sortByModificationDate = (list) => {
  return list.sort((a, b) => {
    let aModificationDate = a.modified
    if (!aModificationDate) aModificationDate = a.content ? a.content.modified : ''
    let bModificationDate = b.modified
    if (!bModificationDate) bModificationDate = b.content ? b.content.modified : ''

    if (aModificationDate < bModificationDate) return 1
    if (aModificationDate > bModificationDate) return -1
    else return 0
  })
}

const sortByNumberOfMembers = (list) => {
  return list.sort((a, b) => {
    if (a.number_of_members > b.number_of_members) return 1
    if (a.number_of_members < b.number_of_members) return -1
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

const sortByRole = (list, lang) => {
  return list.sort((a, b) => compareStrings(a.member.role, b.member.role, lang))
}

const sortBySpaceType = (list, lang) => {
  return list.sort((a, b) => {
    const aSpaceType = a.accessType || a.access_type
    const bSpaceType = b.accessType || b.access_type

    return compareStrings(aSpaceType, bSpaceType, lang)
  })
}

// INFO - GB - 2022-11-22 - The statuses have an order of priority,
// if a status is not in the list, it will be sorted in alphabetical order
const sortByStatus = (list, lang) => {
  return list.sort((a, b) => {
    let aStatus = a.status || a.statusSlug
    if (!aStatus) aStatus = a.content ? a.content.statusSlug : ''
    let bStatus = b.status || b.statusSlug
    if (!bStatus) bStatus = b.content ? b.content.statusSlug : ''

    const statusOrder = [STATUSES.OPEN, STATUSES.VALIDATED, STATUSES.CANCELLED, STATUSES.DEPRECATED]

    const aStatusIndex = statusOrder.indexOf(aStatus)
    const bStatusIndex = statusOrder.indexOf(bStatus)

    if (aStatusIndex !== -1 && bStatusIndex !== -1) return (aStatusIndex - bStatusIndex)
    else return compareStrings(aStatus, bStatus, lang)
  })
}

const sortByUsername = (list, lang) => {
  return list.sort((a, b) => compareStrings(a.username, b.username, lang))
}

const compareStrings = (a, b, lang) => {
  const locale = lang ? lang.replace(/_/g, '-') : undefined
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
