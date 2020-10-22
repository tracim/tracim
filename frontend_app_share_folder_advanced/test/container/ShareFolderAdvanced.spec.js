import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import { ShareFolderAdvanced } from '../../src/container/ShareFolderAdvanced.jsx'
import { mockGetContentTypeList200, mockGetImportAuthorizationsList200 } from '../apiMock'
import { debug } from '../../src/debug.js'
import { CONTENT_TYPE } from 'tracim_frontend_lib'

debug.config.apiUrl = 'http://unit.test:6543/api'

describe('<ShareFolderAdvanced />', () => {
  const appContentCustomEventHandlerAllAppChangeLanguageSpy = sinon.spy()
  const appContentCustomEventHandlerShowAppSpy = sinon.spy()
  const appContentCustomEventHandlerHideAppSpy = sinon.spy()

  const props = {
    registerCustomEventHandlerList: () => {},
    t: key => key,
    loggedUser: {
      userId: 5,
      username: 'JohnD',
      firstname: 'John',
      lastname: 'Doe',
      email: 'test@test.test',
      avatar: '',
      lang: 'fr'
    },
    setApiUrl: () => {},
    appContentCustomEventHandlerAllAppChangeLanguage: appContentCustomEventHandlerAllAppChangeLanguageSpy,
    appContentCustomEventHandlerShowApp: appContentCustomEventHandlerShowAppSpy,
    appContentCustomEventHandlerHideApp: appContentCustomEventHandlerHideAppSpy
  }

  mockGetImportAuthorizationsList200(debug.config.apiUrl, debug.content.workspace_id, {})
  mockGetContentTypeList200(debug.config.apiUrl, Object.values(CONTENT_TYPE).map(ct => ({ slug: ct }))).persist()

  const wrapper = shallow(<ShareFolderAdvanced {...props} />)

  describe('Custom Event Handler', () => {
    describe('handleAllAppChangeLanguage()', () => {
      describe('change the language to portuguese', () => {
        wrapper.instance().handleAllAppChangeLanguage('pt')

        it('should call the appContentCustomEventHandlerAllAppChangeLanguage function', () => {
          expect(appContentCustomEventHandlerAllAppChangeLanguageSpy.called).to.equal(true)
        })
      })
    })

    describe('handleShowApp()', () => {
      describe('show the app', () => {
        wrapper.instance().handleShowApp({})

        it('should call the appContentCustomEventHandlerShowApp function', () => {
          expect(appContentCustomEventHandlerShowAppSpy.called).to.equal(true)
        })
      })
    })

    describe('handleHideApp()', () => {
      describe('hide the app', () => {
        wrapper.instance().handleHideApp({})

        it('should call the appContentCustomEventHandlerHideApp function', () => {
          expect(appContentCustomEventHandlerHideAppSpy.called).to.equal(true)
        })
      })
    })
  })
})
