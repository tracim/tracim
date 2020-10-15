/*
RJ - 2020-10-15 - Note:
Disabling this file since mockGetCollaborativeDocumentTemplates200(debug.config.apiUrl)
causes the following error: TypeError: Cannot read property 'replace' of null
See https://github.com/tracim/tracim/issues/3695

import React from 'react'
import { shallow } from 'enzyme'
import { expect } from 'chai'
import sinon from 'sinon'
import { fileTlm, author } from 'tracim_frontend_lib/dist/tracim_frontend_lib.test_utils.js'
import {
  PopupCreateCollaborativeDocument as PopupCreateCollaborativeDocumentWithoutHoc
} from '../src/container/PopupCreateOfficeDocument.jsx'
import {
  mockGetCollaborativeDocumentTemplates200
} from './apiMock.js'
import { debug } from '../src/debug.js'

describe('<PopupCreateOfficeDocument />', () => {
  const props = {
    setApiUrl: () => {},
    registerLiveMessageHandlerList: () => {},
    registerCustomEventHandlerList: () => {},
    i18n: {},
    content: {},
    loggedUser: {
      user_id: 1
    },
    t: key => key
  }

  mockGetCollaborativeDocumentTemplates200(debug.config.apiUrl)

  const wrapper = shallow(<PopupCreateCollaborativeDocumentWithoutHoc {...props} />)
  const wrapperInstance = wrapper.instance()

  describe('TLM Handlers', () => {
    describe('eventType content', () => {
      const baseFileTlm = {
        author: author,
        content: fileTlm,
        client_token: null,
        workspace: {
          workspace_id: 1
        }
      }

      describe('handleContentFileCreated', () => {
        const tlmData = {
          fields: {
            ...baseFileTlm,
            content: {
              ...fileTlm,
              parent_id: 0,
              content_id: fileTlm.content_id,
              created: '2022-06-09T10:28:43.511Z',
              label: ''
            }
          }
        }
        const handleCloseSpy = sinon.stub(wrapperInstance, 'handleClose')
        // Force the component and wrapper to update so that the stub is used
        wrapperInstance.forceUpdate()
        wrapper.update()

        before(() => {
          wrapperInstance.handleContentFileCreated(tlmData)
        })

        it('should call handleClose function', () => {
          expect(handleCloseSpy.called).to.equal(true)
        })
      })
    })
  })
})
*/
