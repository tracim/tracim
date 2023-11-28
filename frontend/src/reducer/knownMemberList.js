import {
  SET_KNOWN_MEMBER_LIST,
  ADD_WORKSPACE_MEMBER,
  REMOVE_WORKSPACE_MEMBER,
  UPDATE_USER,
  REMOVE,
  WORKSPACE_LIST
} from '../action-creator.sync.js'
import { serialize } from 'tracim_frontend_lib'
const initialState = []

export const serializeKnownMemberProps = {
  username: 'username',
  has_cover: 'hasCover',
  user_id: 'userId',
  public_name: 'publicName',
  has_avatar: 'hasAvatar',
  workspace_ids: 'spaceList'
}

export function knownMemberList (state = initialState, action) {
  let knownMemberToRemove = []

  switch (action.type) {
    case SET_KNOWN_MEMBER_LIST:
      return action.knownMemberList.map(apiKnownMember =>
        serialize(apiKnownMember, serializeKnownMemberProps)
      )

    case ADD_WORKSPACE_MEMBER: {
      const isNewMemberAlreadyInKnownMemberList = state
        .some(km => km.userId === action.newMember.user.user_id)

      if (isNewMemberAlreadyInKnownMemberList) {
        return state.map(km => km.userId === action.newMember.user.user_id
          ? ({ ...km, spaceList: [...km.spaceList, action.workspaceId] })
          : km
        )
      }

      return [
        ...state,
        {
          ...serialize(action.newMember.user, serializeKnownMemberProps),
          spaceList: [action.workspaceId]
        }
      ]
    }

    case REMOVE_WORKSPACE_MEMBER:
      knownMemberToRemove = state.find(km => km.userId === action.memberId)
      if (knownMemberToRemove.spaceList.length > 1) {
        return state.map(km => km.userId === action.memberId
          ? { ...km, spaceList: km.spaceList.filter(spaceId => spaceId !== action.workspaceId) }
          : km
        )
      }
      return state.filter(km => km.userId !== action.memberId)

    case UPDATE_USER:
      return state.map(km => km.userId === action.newUser.user_id
        ? { ...km, ...serialize(action.newUser, serializeKnownMemberProps) }
        : km
      )

    case `${REMOVE}/${WORKSPACE_LIST}`:
      return state.map(km => {
        return { ...km, spaceList: km.spaceList.filter(spaceId => spaceId !== action.workspace.workspace_id) }
      })

    default:
      return state
  }
}

export default knownMemberList
