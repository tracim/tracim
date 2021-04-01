import {
  FAVORITE_LIST,
  FAVORITE,
  ADD,
  REMOVE,
  SET
} from '../action-creator.sync.js'
import { serializeContentProps } from './workspaceContentList.js'
import { serializeUserProps } from './user.js'
import { serialize } from 'tracim_frontend_lib'

const serializeFavoriteProps = {
  content_id: 'contentId',
  user_id: 'userId',
  original_label: 'originalLabel',
  original_type: 'originalType'
}

const serializeFavorite = (apiFavorite) => {
  return {
    ...serialize(apiFavorite, serializeFavoriteProps),
    content: {
      ...serialize(apiFavorite.content, serializeContentProps),
      author: serialize(apiFavorite.content.author, serializeUserProps),
      lastModifier: serialize(apiFavorite.content.last_modifier, serializeUserProps)
    }
  }
}

const favoriteList = (state = [], action) => {
  switch (action.type) {
    case `${SET}/${FAVORITE_LIST}`:
      return action.favoriteList.map(serializeFavorite)
    case `${ADD}/${FAVORITE_LIST}`:
      return [
        ...state,
        serializeFavorite(action.favorite)
      ]
    case `${REMOVE}/${FAVORITE}`:
      return state.filter(favorite => favorite.contentId !== action.favorite.contentId)
    default:
      return state
  }
}

export default favoriteList
