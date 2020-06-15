import { expect } from 'chai'
import userReducer, { serializeUserProps, defaultUser } from '../../../src/reducer/user.js'
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
import { serialize } from 'tracim_frontend_lib'

describe('user reducer', () => {
  it('should return the default state', () => {
    expect(userReducer(undefined, {})).to.deep.equal(defaultUser)
  })

  it(`should handle ${UPDATE}/${USER}`, () => {
    expect(
      userReducer(defaultUser, updateUser({ ...globalManagerFromApi, public_name: 'newPublicName' }))
    ).to.deep.equal({
      ...serialize(globalManagerFromApi, serializeUserProps),
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
      ...serialize(globalManagerFromApi, serializeUserProps),
      logged: true
    })
  })
})
