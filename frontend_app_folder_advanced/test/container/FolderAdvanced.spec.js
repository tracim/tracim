import React from 'react'
import { shallow } from 'enzyme'
import { FolderAdvanced } from '../../src/container/FolderAdvanced.jsx'
import { expect } from 'chai'
import sinon from 'sinon'
import {
  mockGetFolder200,
  mockGetSystemContentTypes200
} from '../apiMock.js'
import { debug } from '../../src/debug.js'

debug.config.apiUrl = 'http://unit.test:6543/api'

describe('<FolderAdvanced />', () => {
  const dispatchEventSpy = sinon.spy()
  global.GLOBAL_dispatchEvent = dispatchEventSpy

  const props = {
    data: debug,
    setApiUrl: () => { },
    t: key => key,
    registerLiveMessageHandlerList: () => { },
    registerCustomEventHandlerList: () => { },
    i18n: {}
  }
  const buildBreadcrumbsSpy = sinon.spy()
  const setHeadTitleSpy = sinon.spy()

  mockGetSystemContentTypes200(debug.config.apiUrl, [{ label: 'folder' }, { label: 'html-document' }]).persist()
  mockGetFolder200(debug.config.apiUrl, debug.content.workspace_id, debug.content.content_id, debug.content).persist()

  const wrapper = shallow(<FolderAdvanced {...props} />)
  wrapper.instance().buildBreadcrumbs = buildBreadcrumbsSpy
  wrapper.instance().setHeadTitle = setHeadTitleSpy

  const resetSpiesHistory = () => {
    buildBreadcrumbsSpy.resetHistory()
    setHeadTitleSpy.resetHistory()
  }

  describe('TLM Handlers', () => {
    describe('eventType content folder', () => {
      describe('handleFolderChanged (same folder)', () => {
        const tlmData = {
          fields: {
            author: {
              avatar_url: null,
              public_name: 'Global manager',
              user_id: 1
            },
            content: {
              ...debug.content,
              label: 'Hello, world'
            },
            client_token: wrapper.state('config').apiHeader['X-Tracim-ClientToken']
          }
        }

        before(() => {
          resetSpiesHistory()
          wrapper.instance().handleFolderChanged(tlmData)
        })

        after(() => {
          resetSpiesHistory()
        })

        it("should update the component's folder", () => {
          expect(wrapper.state('newContent')).to.deep.equal(tlmData.fields.content)
        })
        it('should call buildBreadcrumbs()', () => {
          expect(buildBreadcrumbsSpy.called).to.equal(true)
        })
        it('should call setHeadTitle() with the right args', () => {
          expect(setHeadTitleSpy.calledOnceWith(tlmData.fields.content.label)).to.equal(true)
        })
      })

      describe('handleFolderChanged (different folder)', () => {
        const tlmData = {
          fields: {
            author: {
              avatar_url: null,
              public_name: 'Global manager',
              user_id: 1
            },
            content: {
              ...debug.content,
              content_id: 2
            }
          }
        }

        before(() => {
          dispatchEventSpy.resetHistory()
          wrapper.instance().handleFolderChanged(tlmData)
        })

        it("should NOT update the component's folder", () => {
          expect(wrapper.state('newContent')).to.not.equal(tlmData.fields.content)
        })
        it('should NOT update the head title', () => {
          expect(dispatchEventSpy.called).to.be.false // eslint-disable-line no-unused-expressions
        })
      })
    })
  })

  describe('its internal functions', () => {
    describe('handleClickRefresh', () => {
      it('should update content state', () => {
        wrapper.setState(prev => ({ newContent: { ...prev.content, label: 'New Name' } }))
        wrapper.instance().handleClickRefresh()
        expect(wrapper.state('content')).to.deep.equal(wrapper.state('newContent'))
      })

      it('should update showRefreshWarning state', () => {
        wrapper.instance().handleClickRefresh()
        expect(wrapper.state('showRefreshWarning')).to.deep.equal(false)
      })
    })
  })
})
