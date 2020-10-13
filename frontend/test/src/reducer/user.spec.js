import { expect } from 'chai'
import userReducer, { serializeUserProps, defaultUser } from '../../../src/reducer/user.js'
import {
  SET,
  setUserConfiguration,
  setUserConnected,
  setUserDisconnected,
  setUserLang,
  UPDATE,
  updateUser,
  updateUserAgendaUrl,
  USER,
  USER_AGENDA_URL,
  USER_CONFIGURATION,
  USER_CONNECTED,
  USER_DISCONNECTED,
  USER_LANG
} from '../../../src/action-creator.sync'
import { globalManagerFromApi } from '../../fixture/user/globalManagerFromApi.js'
import { serialize } from 'tracim_frontend_lib'

describe('user reducer', () => {
  it('should return the default state', () => {
    expect(userReducer(undefined, {})).to.deep.equal(defaultUser)
  })

  it(`should handle ${UPDATE}/${USER}`, () => {
    expect(
      userReducer(
        { ...defaultUser, userId: globalManagerFromApi.user_id },
        updateUser({ ...globalManagerFromApi, public_name: 'newPublicName' })
      )
    ).to.deep.equal({
      ...serialize(globalManagerFromApi, serializeUserProps),
      publicName: 'newPublicName'
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

  it(`should handle ${SET}/${USER_CONFIGURATION}`, () => {
    expect(
      userReducer(defaultUser, setUserConfiguration({ param1: 'value1' }))
    ).to.deep.equal({
      ...defaultUser,
      config: { param1: 'value1' }
    })
  })
})
