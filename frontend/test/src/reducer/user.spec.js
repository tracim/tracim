import { expect } from 'chai'
import userReducer from '../../../src/reducer/user.js'
import {
  UPDATE,
  USER_USERNAME,
  USER_PUBLIC_NAME
} from '../../../src/action-creator.sync'
import { PROFILE } from 'tracim_frontend_lib'
import { globalManager } from '../../fixture/user/globalManager.js'


const defaultStateUser = {
  user_id: -1,
  logged: null,
  auth_type: '',
  timezone: '',
  profile: PROFILE.user,
  email: '',
  is_active: true,
  avatar_url: null,
  created: '',
  public_name: '',
  lang: 'en',
  agendaUrl: '',
  username: ''
}

describe('user reducer', () => {
  it('should return the default state', () => {
    expect(userReducer(undefined, {})).to.deep.equal(defaultStateUser)
  })

  it(`should handle ${UPDATE}/${USER_PUBLIC_NAME}`, () => {
    expect(
      userReducer(globalManager, {
        type: `${UPDATE}/${USER_PUBLIC_NAME}`,
        newName: 'new_public_name'
      })
    ).to.deep.equal({
      ...globalManager,
      public_name: 'new_public_name'
    })
  })

  it(`should handle ${UPDATE}/${USER_USERNAME}`, () => {
    expect(
      userReducer(globalManager, {
        type: `${UPDATE}/${USER_USERNAME}`,
        newUsername: 'new_username'
      })
    ).to.deep.equal({
      ...globalManager,
      username: 'new_username'
    })
  })
})
