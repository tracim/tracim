import { uniqBy } from 'lodash'
import {
  APPEND,
  PUBLICATION,
  REMOVE,
  SET,
  UPDATE,
  WORKSPACE_PUBLICATION_LIST
} from '../action-creator.sync.js'
import { serializeContentProps } from './workspaceContentList.js'
import { serialize } from 'tracim_frontend_lib'

function sortByModifiedDate (arrayToSort) {
  return arrayToSort.sort(function (a, b) {
    if (a.modified > b.modified) return 1
    if (a.modified < b.modified) return -1
    return 0
  })
}

function uniqByContentId (array) {
  return uniqBy(array, 'id')
}

const defaultPublicationList = []

export default function publicationList(state = defaultPublicationList, action) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_PUBLICATION_LIST}`:
      return uniqByContentId(sortByModifiedDate(
        action.publicationList.map(publication => serialize(publication, serializeContentProps))
      ))

    case `${UPDATE}/${WORKSPACE_PUBLICATION_LIST}`:
      return uniqByContentId(sortByModifiedDate(state))

    case `${REMOVE}/${PUBLICATION}`:
      return state.filter(publication => action.publicationId !== publication.contentId)

    case `${APPEND}/${PUBLICATION}`: {
      const newPublicationList = state
      newPublicationList.push(action.publication)
      return uniqByContentId(newPublicationList)
    }

    default:
      return state
  }
}
