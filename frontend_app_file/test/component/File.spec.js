import React from 'react'
import { shallow } from 'enzyme'
import { File as ComponentWithoutHOC } from '../../src/container/File.jsx'
import { expect } from 'chai'
import {
  mockGetFileContent200,
  mockPutMyselfFileRead200,
  mockGetFileComment200,
  mockGetShareLinksList200,
  mockGetFileRevision200
} from '../apiMock.js'
import content from '../fixture/content/content.js'
import { debug } from '../../src/debug.js'
import {
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  eventTypeBuilder
} from 'tracim_frontend_lib'
import { commentTlm } from '../fixture/tracimLiveMessageData/commentTlm.js'
import { TracimComponentMock } from 'tracim_frontend_lib/dist/tracim_frontend_lib.test.js'

describe('<File />', () => {
  let triggerTLM

  const props = {
    setApiUrl: () => {},
    buildTimelineFromCommentAndRevision: (commentList, revisionList) => [...commentList, ...revisionList],
    i18n: {},
    content,
    t: key => key
  }

  mockGetFileContent200(debug.config.apiUrl, content.file.workspace_id, content.file.content_id, content.file)
  mockPutMyselfFileRead200(debug.config.apiUrl, content.file.workspace_id, content.file.content_id)
  mockGetShareLinksList200(debug.config.apiUrl, content.file.workspace_id, content.file.content_id, content.shareList)
  mockGetFileComment200(debug.config.apiUrl, content.file.workspace_id, content.file.content_id, content.commentList).persist()
  mockGetFileRevision200(debug.config.apiUrl, content.file.workspace_id, content.file.content_id, content.revisionList).persist()

  const ComponentWithHoc = TracimComponentMock(trigger => { triggerTLM = trigger })(ComponentWithoutHOC)

  // INFO - GM - 2020/05/22 - dive in order to render the HOC component AND the target component File, in order to not use useless mount
  const wrapper = shallow(<ComponentWithHoc {...props} />).dive()

  describe('TLM events', () => {
    describe('content created', () => {
      it('Timeline should contains the new comment created', () => {
        const tlmData = {
          author: {
            avatar_url: null,
            public_name: 'Global manager',
            user_id: 1
          },
          content: {
            ...commentTlm,
            parent_id: content.file.content_id,
            content_id: 9
          }
        }

        triggerTLM(eventTypeBuilder(TLM_ET.CONTENT.FILE, TLM_CET.CREATED), tlmData)
        expect(wrapper.state('timeline')[wrapper.state('timeline').length - 1].content_id).to.equal(tlmData.content.content_id)
      })

      it('Timeline should be sorted even when 2 tlm arrive in the wrong order', () => {
        const tlmData1 = {
          content: {
            ...commentTlm,
            parent_id: content.file.content_id,
            content_id: 10,
            created: '2020-05-22T14:02:02Z'
          }
        }

        const tlmData2 = {
          content: {
            ...commentTlm,
            parent_id: content.file.content_id,
            content_id: 11,
            created: '2020-05-22T14:02:05Z'
          }
        }
        triggerTLM(eventTypeBuilder(TLM_ET.CONTENT.FILE, TLM_CET.CREATED), tlmData2)
        triggerTLM(eventTypeBuilder(TLM_ET.CONTENT.FILE, TLM_CET.CREATED), tlmData1)

        expect(wrapper.state('timeline')[wrapper.state('timeline').length - 1].content_id).to.equal(tlmData2.content.content_id)
        expect(wrapper.state('timeline')[wrapper.state('timeline').length - 2].content_id).to.equal(tlmData1.content.content_id)
      })

      it('Timeline should not be updated when the TracimLiveMessage is not related to the current file', () => {
        const tlmData = {
          content: {
            ...commentTlm,
            parent_id: content.file.content_id + 1,
            content_id: 12
          }
        }
        const oldTimelineLength = wrapper.state('timeline').length

        triggerTLM(eventTypeBuilder(TLM_ET.CONTENT.FILE, TLM_CET.CREATED), tlmData)
        expect(wrapper.state('timeline').length).to.equal(oldTimelineLength)
      })
    })
    describe('content modified', () => {
      it('The state should be updated with the content modified (filename modified)', () => {
        const tlmData = {
          content: {
            ...content.file,
            filename: 'newName.jpeg'
          }
        }

        triggerTLM(eventTypeBuilder(TLM_ET.CONTENT.FILE, TLM_CET.MODIFIED), tlmData)
        expect(wrapper.state('content').filename).to.equal(tlmData.content.filename)
      })

      it('The state should not be updated when the modification do not concern the current file', () => {
        const tlmData = {
          content: {
            ...content.file,
            filename: 'WrongName.jpeg',
            content_id: content.file.content_id + 1
          }
        }

        triggerTLM(eventTypeBuilder(TLM_ET.CONTENT.FILE, TLM_CET.MODIFIED), tlmData)
        expect(wrapper.state('content').filename).to.not.equal(tlmData.content.filename)
      })
    })
  })
})
