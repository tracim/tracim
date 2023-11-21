import {
  SET_KNOWN_MEMBER_LIST,
  ADD,
  WORKSPACE_MEMBER,
  REMOVE,
  UPDATE,
  USER
} from '../action-creator.sync'
import { serialize } from 'tracim_frontend_lib'
import { serializeUserProps } from './user.js'
const initialState = []

export function knownMemberList (state=initialState, action) {
  switch (action.type) {
    case SET_KNOWN_MEMBER_LIST:
      return action.knownMemberList.map(km => serialize(km, serializeUserProps))

    case `${ADD}/${WORKSPACE_MEMBER}`:
      return [...state, serialize(action.newMember.user, serializeUserProps)]

    case `${REMOVE}/${WORKSPACE_MEMBER}`:
      return state.filter(km => km.userId !== action.memberId)

    case `${UPDATE}/${USER}`:
      return state.map(km => km.userId === action.newUser.user_id
        ? {...km, ...serialize(action.newUser, serializeUserProps)}
        : km
      )

    default:
      return state
  }
}

export default knownMemberList
