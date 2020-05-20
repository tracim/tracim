import React from 'react'
import { shallow } from 'enzyme'
import { File } from '../../src/container/File.jsx'
import {
  mockGetFileContent200,
  mockPutMyselfFileRead200,
  mockGetFileComment200,
  mockGetShareLinksList200,
  mockGetFileRevision200
} from '../apiMock.js'
import content from '../fixture/content/content.js'
import { debug } from '../../src/debug.js'
import { registerLiveMessageHandlerListMock } from '../tlmMock.js'
import { TLM_CORE_EVENT_TYPE as TLM_CET, TLM_ENTITY_TYPE as TLM_ET } from 'tracim_frontend_lib'

describe('<File />', () => {
  let tlmHandlerList = {}

  const props = {
    setApiUrl: () => {},
    registerLiveMessageHandlerList: registerLiveMessageHandlerListMock(t => { tlmHandlerList = t }),
    buildTimelineFromCommentAndRevision: (commentList, revisionList) => [...commentList, ...revisionList],
    i18n: {},
    content
  }

  mockGetFileContent200(debug.config.apiUrl, content.file.workspace_id, content.file.content_id, content.file)
  mockPutMyselfFileRead200(debug.config.apiUrl, content.file.workspace_id, content.file.content_id)
  mockGetFileComment200(debug.config.apiUrl, content.file.workspace_id, content.file.content_id, content.commentList)
  mockGetShareLinksList200(debug.config.apiUrl, content.file.workspace_id, content.file.content_id, content.shareList)
  mockGetFileRevision200(debug.config.apiUrl, content.file.workspace_id, content.file.content_id, content.revisionList)

  const wrapper = shallow(<File {...props} t={tradKey => tradKey} />)

  describe('internal function', () => {
    it('content modified', () => {
      tlmHandlerList[TLM_ET.CONTENT][TLM_CET.MODIFIED]({})
    })
  })
})
