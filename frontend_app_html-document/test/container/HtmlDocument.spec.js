import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import {
  mockGetHtmlDocumentComment200,
  mockGetHtmlDocumentContent200,
  mockGetHtmlDocumentRevision200,
  mockPutHtmlDocumentRead200
} from '../apiMock.js'
import { commentTLM } from '../fixture/tracimLiveMessageData/commentTLM.js'
import { HtmlDocument } from '../../src/container/HtmlDocument.jsx'
import { APP_FEATURE_MODE } from 'tracim_frontend_lib'
import content from '../fixture/content/content.js'
import { debug } from '../../src/debug.js'

describe('<HtmlDocument />', () => {
  const props = {
    buildTimelineFromCommentAndRevision: (commentList, revisionList) => [...commentList, ...revisionList],
    content,
    i18n: {},
    registerCustomEventHandlerList: () => { },
    registerLiveMessageHandlerList: () => { },
    setApiUrl: () => { },
    t: key => key
  }

  mockGetHtmlDocumentContent200(debug.config.apiUrl, content.htmlDocument.workspace_id, content.htmlDocument.content_id, content.htmlDocument)
  mockPutHtmlDocumentRead200(debug.loggedUser, debug.config.apiUrl, content.htmlDocument.workspace_id, content.htmlDocument.content_id)
  mockGetHtmlDocumentComment200(debug.config.apiUrl, content.htmlDocument.workspace_id, content.htmlDocument.content_id, content.commentList).persist()
  mockGetHtmlDocumentRevision200(debug.config.apiUrl, content.htmlDocument.workspace_id, content.htmlDocument.content_id, content.revisionList).persist()

  const wrapper = shallow(<HtmlDocument {...props} />)

  describe('TLM handlers', () => {
    describe('eventType content', () => {
      describe('handleContentCreated', () => {
        describe('create a new comment', () => {
          const tlmData = {
            content: {
              ...commentTLM,
              parent_id: content.htmlDocument.content_id,
              content_id: 9,
              created: '2020-01-07T16:28:05Z'
            }
          }

          it('should update the timeline if is related to the current html-document', () => {
            wrapper.instance().handleContentCreated(tlmData)
            expect(wrapper.state('timeline')[wrapper.state('timeline').length - 1].content_id).to.equal(tlmData.content.content_id)
          })

          it('should not update the timeline if is not related to the current html-document', () => {
            const tlmDataOtherContent = {
              content: {
                ...commentTLM,
                parent_id: content.htmlDocument.content_id + 1,
                content_id: 12
              }
            }
            const oldTimelineLength = wrapper.state('timeline').length
            wrapper.instance().handleContentCreated(tlmDataOtherContent)

            expect(wrapper.state('timeline').length).to.equal(oldTimelineLength)
          })

          it('should sort the timeline if two TracimLiveMessages arrive in the wrong order', () => {
            const tlmData2 = {
              content: {
                ...commentTLM,
                parent_id: content.htmlDocument.content_id,
                content_id: 11,
                created: '2020-01-07T15:30:05Z'
              }
            }
            wrapper.instance().handleContentCreated(tlmData)
            wrapper.instance().handleContentCreated(tlmData2)
            expect(wrapper.state('timeline')[wrapper.state('timeline').length - 1].content_id).to.equal(tlmData2.content.content_id)
            expect(wrapper.state('timeline')[wrapper.state('timeline').length - 2].content_id).to.equal(tlmData.content.content_id)
          })
        })
      })

      describe('handleContentModified', () => {
        describe('modify the content name', () => {
          const tlmData = {
            author: content.htmlDocument.last_modifier,
            content: {
              ...content.htmlDocument,
              label: 'newContentName'
            }
          }

          before(() => {
            wrapper.instance().handleContentModified(tlmData)
          })

          it('should be updated with the content modified', () => {
            expect(wrapper.state('content').label).to.equal(tlmData.content.label)
          })
        })

        describe('modify the content of the html-document', () => {
          const tlmData = {
            author: content.htmlDocument.last_modifier,
            content: {
              ...content.htmlDocument,
              raw_content: '<p>Html Document Content</p>'
            }
          }

          it('should be updated with the content modified', () => {
            wrapper.instance().handleContentModified(tlmData)
            expect(wrapper.state('content').raw_content).to.equal(tlmData.content.raw_content)
          })

          it('should stay in edit mode if the user is editing', () => {
            wrapper.setState({ mode: APP_FEATURE_MODE.EDIT })
            wrapper.instance().handleContentModified(tlmData)

            expect(wrapper.state('keepEditingWarning')).to.equal(true)
            expect(wrapper.state('mode')).to.equal(APP_FEATURE_MODE.EDIT)
          })
        })

        describe('modify a content not related to another content', () => {
          const tlmData = {
            content: {
              ...content.htmlDocument,
              raw_content: '<p>Html Document content on other doc</p>',
              content_id: content.htmlDocument.content_id + 1
            }
          }

          it('should not be updated when the modification that do not concern the current content', () => {
            wrapper.instance().handleContentModified(tlmData)
            expect(wrapper.state('content').raw_content).to.not.equal(tlmData.content.raw_content)
          })
        })
      })

      describe('handleContentDeleted', () => {
        describe('delete the current content', () => {
          const tlmData = {
            author: content.htmlDocument.last_modifier,
            content: content.htmlDocument
          }

          after(() => {
            wrapper.setState({ content: content.htmlDocument })
          })

          it('should be deleted correctly', () => {
            wrapper.instance().handleContentDeleted(tlmData)
            expect(wrapper.state('content').is_deleted).to.equal(true)
          })
        })

        describe('delete a content which is not the current one', () => {
          const tlmData = {
            content: {
              ...content.htmlDocument,
              content_id: content.htmlDocument.content_id + 1
            }
          }

          it('should not be deleted', () => {
            wrapper.instance().handleContentDeleted(tlmData)
            expect(wrapper.state('content').is_deleted).to.equal(false)
          })
        })
      })

      describe('handleContentUndeleted', () => {
        describe('restore the current content', () => {
          const tlmData = {
            author: content.htmlDocument.last_modifier,
            content: content.htmlDocument
          }

          after(() => {
            wrapper.setState({ content: content.htmlDocument })
          })

          it('should be restored correctly', () => {
            wrapper.setState(prev => ({ content: { ...prev.content, is_deleted: true } }))
            wrapper.instance().handleContentUndeleted(tlmData)

            expect(wrapper.state('content').is_deleted).to.equal(false)
          })
        })

        describe('restore a content which is not the current one', () => {
          const tlmData = {
            content: {
              ...content.htmlDocument,
              content_id: content.htmlDocument.content_id + 1
            }
          }

          it('should not be restored', () => {
            wrapper.setState(prev => ({ content: { ...prev.content, is_deleted: true } }))
            wrapper.instance().handleContentUndeleted(tlmData)

            expect(wrapper.state('content').is_deleted).to.equal(true)
          })
        })
      })
    })
  })
})
