import React from 'react'
import { shallow } from 'enzyme'
import { PopupCreateKanban } from '../../src/container/PopupCreateKanban.jsx'
import { expect } from 'chai'
import nock from 'nock'
import sinon from 'sinon'

import {
  CUSTOM_EVENT
} from 'tracim_frontend_lib'

import { debug } from '../../src/debug.js'

const mockPostRawFileContent = (apiUrl, workspaceId, status, errorCode) => {
  return nock(apiUrl)
    .post(`/workspaces/${workspaceId}/files`)
    .reply(status, {
      error_code: errorCode
    })
}
debug.config.apiUrl = 'http://unit.test:6543/api'

describe('<PopupCreateKanban />', () => {
  const tSpy = sinon.spy()
  const dispatchEventSpy = sinon.spy()
  const props = {
    t: tSpy,
    data: debug,
    setApiUrl: () => {},
    registerCustomEventHandlerList: () => {}
  }

  const wrapper = shallow(<PopupCreateKanban {...props} />)
  global.GLOBAL_dispatchEvent = dispatchEventSpy
  describe('Creation errors', () => {
    for (const error of [
      { status: 400, errorCode: 3002, message: 'A content with the same name already exists' },
      { status: 400, errorCode: 6002, message: 'The file is larger than the maximum file size allowed' },
      { status: 400, errorCode: 6003, message: 'Error, the space exceed its maximum size' },
      { status: 400, errorCode: 6004, message: 'You have reached your storage limit, you cannot add new files' }
    ]) {
      const postRawFileContentMock = mockPostRawFileContent('http://unit.test:6543/api', debug.content.workspace_id, error.status, error.errorCode)
      before(() => {
        tSpy.resetHistory()
        dispatchEventSpy.resetHistory()
        wrapper.setState({ newContentName: 'hello' })
        wrapper.instance().handleValidate()
      })
      it(`should display a specific message: "${error.message}" for code ${error.errorCode}`, () => {
        expect(postRawFileContentMock.done)
        expect(tSpy.called)
        expect(tSpy.returnValues[0] === error.message)
        expect(dispatchEventSpy.called)
        const event = dispatchEventSpy.args[0][0]
        expect(event.type === CUSTOM_EVENT.ADD_FLASH_MSG)
        expect(event.data.type === 'warning')
      })
    }
  })
})
