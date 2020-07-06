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

  describe('TLM Handlers', () => {
    describe('eventType content folder', () => {
      describe('handleFolderChanged (same folder)', () => {
        const tlmData = {
          content: {
            ...folder,
            label: 'Hello, world'
          }
        }

        const wrapper = shallow(<FolderAdvanced {...props} />)

        before(() => {
          dispatchEventSpy.resetHistory()
          wrapper.instance().handleFolderChanged(tlmData)
        })

        it("should update the component's folder", () => {
          expect(wrapper.state('content')).to.equal(tlmData.content)
        })

        it('should update the head title', () => {
          expect(dispatchEventSpy.called).to.be.true
        })
      })

      describe('handleFolderChanged (different folder)', () => {
        const tlmData = {
          content: {
            ...folder,
            content_id: 2
          }
        }

        const wrapper = shallow(<FolderAdvanced {...props} />)

        before(() => {
          dispatchEventSpy.resetHistory()
          wrapper.instance().handleFolderChanged(tlmData)
        })

        it("should NOT update the component's folder", () => {
          expect(wrapper.state('content')).to.not.equal(tlmData.content)
        })
        it('should NOT update the head title', () => {
          expect(dispatchEventSpy.called).to.be.false
        })
      })
    })
  })
})
