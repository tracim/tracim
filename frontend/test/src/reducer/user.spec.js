import { expect } from 'chai'
import userReducer, { serializeUser, defaultUser } from '../../../src/reducer/user.js'
import {
  SET,
  setUserConnected,
  setUserDisconnected,
  setUserLang,
  UPDATE,
  updateUser,
  updateUserAgendaUrl,
  updateUserUsername,
  USER,
  USER_AGENDA_URL,
  USER_CONNECTED,
  USER_DISCONNECTED,
  USER_LANG,
  USER_USERNAME
} from '../../../src/action-creator.sync'
import { globalManagerFromApi } from '../../fixture/user/globalManagerFromApi.js'

describe('user reducer', () => {
  describe('serializers', () => {
    describe('serializeWorkspace()', () => {
      const user = serializeUser(globalManagerFromApi)
      it('should return an object (in camelCase)', () => {
        expect(user).to.deep.equal({
          userId: globalManagerFromApi.user_id,
          logged: globalManagerFromApi.logged,
          authType: globalManagerFromApi.auth_type,
          timezone: globalManagerFromApi.timezone,
          profile: globalManagerFromApi.profile,
          email: globalManagerFromApi.email,
          isActive: globalManagerFromApi.is_active,
          avatarUrl: globalManagerFromApi.avatar_url,
          created: globalManagerFromApi.created,
          publicName: globalManagerFromApi.public_name,
          lang: globalManagerFromApi.lang,
          agendaUrl: globalManagerFromApi.agendaUrl,
          username: globalManagerFromApi.username
        })
      })
    })
  })

  it('should return the default state', () => {
    expect(userReducer(undefined, {})).to.deep.equal(defaultUser)
  })

  it(`should handle ${UPDATE}/${USER}`, () => {
    expect(
      userReducer(defaultUser, updateUser({ ...globalManagerFromApi, public_name: 'newPublicName' }))
    ).to.deep.equal({
      ...serializeUser(globalManagerFromApi),
      publicName: 'newPublicName'
    })
  })

  it(`should handle ${UPDATE}/${USER_USERNAME}`, () => {
    expect(
      userReducer(defaultUser, updateUserUsername('newUsername'))
    ).to.deep.equal({
      ...defaultUser,
      username: 'newUsername'
    })
  })

  it(`should handle ${SET}/${USER_AGENDA_URL}`, () => {
    expect(
      userReducer(defaultUser, updateUserAgendaUrl('agendaUrl'))
    ).to.deep.equal({
      ...defaultUser,
      agendaUrl: 'agendaUrl'
    })
  })

  it(`should handle ${SET}/${USER_LANG}`, () => {
    expect(
      userReducer(defaultUser, setUserLang('pt'))
    ).to.deep.equal({
      ...defaultUser,
      lang: 'pt'
    })
  })

  it(`should handle ${SET}/${USER_DISCONNECTED}`, () => {
    expect(
      userReducer(defaultUser, setUserDisconnected())
    ).to.deep.equal({
      ...defaultUser,
      logged: false
    })
  })

  it(`should handle ${SET}/${USER_CONNECTED}`, () => {
    expect(
      userReducer(defaultUser, setUserConnected({ ...globalManagerFromApi, logged: true }))
    ).to.deep.equal({
      ...serializeUser(globalManagerFromApi),
      logged: true
    })
  })
})
