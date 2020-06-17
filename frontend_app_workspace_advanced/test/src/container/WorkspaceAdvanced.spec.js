import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
// import {
//   mockGetWorkspaceAdvancedComment200,
//   mockGetWorkspaceAdvancedContent200,
//   mockGetWorkspaceAdvancedRevision200,
//   mockPutWorkspaceAdvancedRead200
// } from '../apiMock.js'
import { author } from 'tracim_frontend_lib/dist/tracim_frontend_lib.test_utils.js'
import { WorkspaceAdvanced } from '../../src/container/WorkspaceAdvanced.jsx'
// import { APP_FEATURE_MODE } from 'tracim_frontend_lib'
// import contentWorkspaceAdvanced from '../fixture/content/contentWorkspaceAdvanced.js'
// import { debug } from '../../src/debug.js'

describe('<WorkspaceAdvanced />', () => {
  const props = {
    i18n: {},
    registerCustomEventHandlerList: () => { },
    registerLiveMessageHandlerList: () => { },
    t: key => key
  }

  // mockGetWorkspaceAdvancedContent200(debug.config.apiUrl, contentWorkspaceAdvanced.WorkspaceAdvanced.workspace_id, contentWorkspaceAdvanced.WorkspaceAdvanced.content_id, contentWorkspaceAdvanced.WorkspaceAdvanced)
  // mockPutWorkspaceAdvancedRead200(debug.loggedUser, debug.config.apiUrl, contentWorkspaceAdvanced.WorkspaceAdvanced.workspace_id, contentWorkspaceAdvanced.WorkspaceAdvanced.content_id)
  // mockGetWorkspaceAdvancedComment200(debug.config.apiUrl, contentWorkspaceAdvanced.WorkspaceAdvanced.workspace_id, contentWorkspaceAdvanced.WorkspaceAdvanced.content_id, contentWorkspaceAdvanced.commentList).persist()
  // mockGetWorkspaceAdvancedRevision200(debug.config.apiUrl, contentWorkspaceAdvanced.WorkspaceAdvanced.workspace_id, contentWorkspaceAdvanced.WorkspaceAdvanced.content_id, contentWorkspaceAdvanced.revisionList).persist()

  const wrapper = shallow(<WorkspaceAdvanced {...props} />)

  describe('TLM handlers', () => {
    describe('eventType sharedspace', () => {
      describe('handleWorkspaceModified', () => {
        describe('create a new comment', () => {
          it('should update the timeline if is related to the current html-document', () => {
            const tlmData = {
              author: author
            }
            wrapper.instance().handleWorkspaceModified(tlmData)
            expect(true).to.equal(false)
          })
        })
      })

      describe('handleWorkspaceDeleted', () => {
        describe('modify the content name', () => {
          const tlmData = {
            author: author
          }

          before(() => {
            wrapper.instance().handleWorkspaceDeleted(tlmData)
          })

          it('should update the document with the new name', () => {
            // expect(wrapper.state('content').label).to.equal(tlmData.content.label)
          })
        })
      })
    })
  })

  describe('eventType sharedspace member', () => {
    describe('handleMemberCreated', () => {
      describe('create a new comment', () => {
        it('should update the timeline if is related to the current html-document', () => {
          const tlmData = {
            author: author
          }
          wrapper.instance().handleMemberCreated(tlmData)
          // expect(wrapper.state('timeline')[wrapper.state('timeline').length - 1].content_id).to.equal(tlmData.content.content_id)
        })
      })
    })

    describe('handleMemberModified', () => {
      describe('modify the content name', () => {
        const tlmData = {
          author: author
        }

        before(() => {
          wrapper.instance().handleMemberModified(tlmData)
        })

        it('should update the document with the new name', () => {
          // expect(wrapper.state('content').label).to.equal(tlmData.content.label)
        })
      })
    })

    describe('handleMemberDeleted', () => {
      describe('modify the content name', () => {
        const tlmData = {
          author: author
        }

        before(() => {
          wrapper.instance().handleMemberDeleted(tlmData)
        })

        it('should update the document with the new name', () => {
          // expect(wrapper.state('content').label).to.equal(tlmData.content.label)
        })
      })
    })
  })
})
