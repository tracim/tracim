import { uniqBy } from 'lodash'
import {
  APPEND,
  COMMENT,
  COMMENT_LIST,
  PUBLICATION,
  REMOVE,
  SET,
  UPDATE,
  WORKSPACE_PUBLICATION_LIST,
  NEXT_PAGE
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

const defaultPublicationPage = {
  list: [],
  nextPageToken: '',
  hasNextPage: false
}

export default function publicationPage (state = defaultPublicationPage, action) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_PUBLICATION_LIST}`:
      return {
        ...state,
        list: uniqByContentId(sortByModifiedDate(
          action.publicationList.map(publication => serialize(publication, serializeContentProps))
        ))
      }

    case `${APPEND}/${WORKSPACE_PUBLICATION_LIST}`: {
      const serializedPublicationList = action.publicationList.map(
        publication => serialize(publication, serializeContentProps)
      )
      return {
        ...state,
        list: uniqByContentId(sortByModifiedDate([...state.list, ...serializedPublicationList]))
      }
    }
    case `${UPDATE}/${WORKSPACE_PUBLICATION_LIST}`:
      return {
        ...state,
        list: uniqByContentId(sortByModifiedDate(state.list))
      }

    case `${UPDATE}/${PUBLICATION}`: {
      const serializedPublication = action.publication.content_id
        ? serialize(action.publication, serializeContentProps)
        : action.publication
      const list = uniqByContentId(state.list.map(publication => serializedPublication.id === publication.id
        ? {
          ...serializedPublication,
          commentList: publication.commentList
        }
        : publication
      ))
      return { ...state, list }
    }

    case `${REMOVE}/${PUBLICATION}`:
      return {
        ...state,
        list: state.list.filter(publication => action.publicationId !== publication.id)
      }

    case `${APPEND}/${PUBLICATION}`: {
      const newPublicationList = state.list
      newPublicationList.push(serialize(action.publication, serializeContentProps))
      return {
        ...state,
        list: uniqByContentId(newPublicationList)
      }
    }

    case `${SET}/${PUBLICATION}/${COMMENT_LIST}`: {
      const list = uniqByContentId(state.list.map(publication => action.publicationId === publication.id
        ? { ...publication, commentList: action.commentList }
        : publication
      ))
      return { ...state, list }
    }

    case `${SET}/${COMMENT}`: {
      const list = uniqByContentId(state.list.map(publication => action.publicationId === publication.id
        ? { ...publication, firstComment: action.comment }
        : publication
      ))
      return { ...state, list }
    }

    case `${SET}/${WORKSPACE_PUBLICATION_LIST}/${NEXT_PAGE}`:
      return { ...state, hasNextPage: action.hasNextPage, nextPageToken: action.nextPageToken }

    default:
      return state
  }
}
