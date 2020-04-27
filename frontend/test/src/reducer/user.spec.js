import { expect } from 'chai'
import userReducer from '../../../src/reducer/user.js'
import {
  UPDATE,
  USER_USERNAME,
  USER_PUBLIC_NAME
} from '../../../src/action-creator.sync'
import { getBrowserLang } from '../../../src/helper.js'
import { PROFILE } from 'tracim_frontend_lib'

const defaultUser = {
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
  lang: getBrowserLang(),
  agendaUrl: '',
  username: ''
}

describe('user reducer', () => {
  it('should return the default state', () => {
    expect(userReducer(undefined, {})).to.deep.equal(defaultUser)
  })

  it(`should handle ${UPDATE}/${USER_PUBLIC_NAME}`, () => {
    expect(
      userReducer(undefined, {
        type: `${UPDATE}/${USER_PUBLIC_NAME}`,
        newName: 'new_public_name'
      })
    ).to.deep.equal({
      ...defaultUser,
      public_name: 'new_public_name'
    })
  })

  it(`should handle ${UPDATE}/${USER_USERNAME}`, () => {
    expect(
      userReducer(undefined, {
        type: `${UPDATE}/${USER_USERNAME}`,
        newUsername: 'new_username'
      })
    ).to.deep.equal({
      ...defaultUser,
      username: 'new_username'
    })
  })
})
