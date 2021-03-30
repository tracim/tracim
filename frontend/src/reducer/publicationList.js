import { uniqBy } from 'lodash'
import {
  APPEND,
  COMMENT,
  COMMENT_LIST,
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

export default function publicationList (state = defaultPublicationList, action) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_PUBLICATION_LIST}`:
      return uniqByContentId(sortByModifiedDate(
        action.publicationList.map(publication => serialize(publication, serializeContentProps))
      ))

    case `${UPDATE}/${WORKSPACE_PUBLICATION_LIST}`:
      return uniqByContentId(sortByModifiedDate(state))

    case `${UPDATE}/${PUBLICATION}`:
      return uniqByContentId(state.map(publication => action.publication.content_id === publication.id
        ? {
          ...serialize(action.publication, serializeContentProps),
          commentList: publication.commentList
        }
        : publication
      ))

    case `${REMOVE}/${PUBLICATION}`:
      return state.filter(publication => action.publicationId !== publication.id)

    case `${APPEND}/${PUBLICATION}`: {
      const newPublicationList = state
      newPublicationList.push(serialize(action.publication, serializeContentProps))
      return uniqByContentId(newPublicationList)
    }

    case `${SET}/${PUBLICATION}/${COMMENT_LIST}`:
      return uniqByContentId(state.map(publication => action.publicationId === publication.id
        ? { ...publication, commentList: action.commentList }
        : publication
      ))

    case `${APPEND}/${PUBLICATION}/${COMMENT}`: {
      return uniqByContentId(state.map(publication => {
        if (action.comment.parent_id === publication.id) {
          const newCommentList = publication.commentList || []
          newCommentList.push(action.comment)
          return { ...publication, commentList: newCommentList }
        } else return publication
      }))
    }

    default:
      return state
  }
}
