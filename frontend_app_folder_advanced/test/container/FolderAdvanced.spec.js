import React from 'react'
import { shallow } from 'enzyme'
import { FolderAdvanced } from '../../src/container/FolderAdvanced.jsx'
import { expect } from 'chai'
import sinon from 'sinon'
import {
  mockGetFolder200,
  mockGetSystemContentTypes200
} from '../apiMock.js'

describe('<FolderAdvanced />', () => {
  const dispatchEventSpy = sinon.spy()
  global.GLOBAL_dispatchEvent = dispatchEventSpy
  const apiUrl = 'http://localhost'
  const folder = {
    label: 'Hello',
    workspace_id: 1,
    content_id: 9,
    created: '2022-06-09T10:28:43.511Z'
  }
  const data = {
    content: folder,
    loggedUser: {
      userId: 1
    },
    config: {
      apiUrl: apiUrl,
      translation: {},
      workspace: {},
      system: {
        config: {}
      }
    },
    isVisible: true
  }
  const props = {
    data: data,
    setApiUrl: url => {},
    t: key => key,
    registerLiveMessageHandlerList: () => {},
    registerCustomEventHandlerList: () => {},
    i18n: {}
  }

  mockGetSystemContentTypes200(apiUrl, [{ label: 'folder' }, { label: 'html-document' }]).persist()
  mockGetFolder200(apiUrl, folder.workspace_id, folder.content_id, folder).persist()

  const wrapper = shallow(<FolderAdvanced {...props} />)

  describe('TLM Handlers', () => {
    describe('eventType content folder', () => {
      describe('handleFolderChanged (same folder)', () => {
        const tlmData = {
          author: {
            avatar_url: null,
            public_name: 'Global manager',
            user_id: 1
          },
          content: {
            ...folder,
            label: 'Hello, world'
          }
        }

        // const wrapper = shallow(<FolderAdvanced {...props} />)

        before(() => {
          dispatchEventSpy.resetHistory()
          wrapper.instance().handleFolderChanged(tlmData)
        })

        it("should update the component's folder", () => {
          expect(wrapper.state('newContent')).to.deep.equal(tlmData.content)
        })

        it('should update the head title', () => {
          expect(dispatchEventSpy.called).to.be.true
        })
      })

      describe('handleFolderChanged (different folder)', () => {
        const tlmData = {
          author: {
            avatar_url: null,
            public_name: 'Global manager',
            user_id: 1
          },
          content: {
            ...folder,
            content_id: 2
          }
        }

        // const wrapper = shallow(<FolderAdvanced {...props} />)

        before(() => {
          dispatchEventSpy.resetHistory()
          wrapper.instance().handleFolderChanged(tlmData)
        })

        it("should NOT update the component's folder", () => {
          expect(wrapper.state('newContent')).to.not.equal(tlmData.content)
        })
        it('should NOT update the head title', () => {
          expect(dispatchEventSpy.called).to.be.false
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

      it('should update hasUpdated state', () => {
        wrapper.instance().handleClickRefresh()
        expect(wrapper.state('hasUpdated')).to.deep.equal(false)
      })
    })
  })
})
