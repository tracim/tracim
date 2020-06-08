import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import {
  mockGetHtmlDocumentComment200,
  mockGetHtmlDocumentContent200,
  mockGetHtmlDocumentRevision200,
  mockPutHtmlDocumentRead200
} from '../apiMock.js'
import { commentTlm } from 'tracim_frontend_lib/dist/tracim_frontend_lib.test_utils.js'
import { HtmlDocument } from '../../src/container/HtmlDocument.jsx'
import { APP_FEATURE_MODE } from 'tracim_frontend_lib'
import contentHtmlDocument from '../fixture/content/contentHtmlDocument.js'
import { debug } from '../../src/debug.js'

describe('<HtmlDocument />', () => {
  const props = {
    buildTimelineFromCommentAndRevision: (commentList, revisionList) => [...commentList, ...revisionList],
    content: contentHtmlDocument,
    i18n: {},
    registerCustomEventHandlerList: () => { },
    registerLiveMessageHandlerList: () => { },
    setApiUrl: () => { },
    t: key => key
  }

  mockGetHtmlDocumentContent200(debug.config.apiUrl, contentHtmlDocument.htmlDocument.workspace_id, contentHtmlDocument.htmlDocument.content_id, contentHtmlDocument.htmlDocument)
  mockPutHtmlDocumentRead200(debug.loggedUser, debug.config.apiUrl, contentHtmlDocument.htmlDocument.workspace_id, contentHtmlDocument.htmlDocument.content_id)
  mockGetHtmlDocumentComment200(debug.config.apiUrl, contentHtmlDocument.htmlDocument.workspace_id, contentHtmlDocument.htmlDocument.content_id, contentHtmlDocument.commentList).persist()
  mockGetHtmlDocumentRevision200(debug.config.apiUrl, contentHtmlDocument.htmlDocument.workspace_id, contentHtmlDocument.htmlDocument.content_id, contentHtmlDocument.revisionList).persist()

  const wrapper = shallow(<HtmlDocument {...props} />)

  describe('TLM handlers', () => {
    describe('eventType content', () => {
      describe('handleContentCreated', () => {
        describe('create a new comment', () => {
          it('should update the timeline if is related to the current html-document', () => {
            const tlmData = {
              content: {
                ...commentTlm,
                parent_id: contentHtmlDocument.htmlDocument.content_id,
                content_id: 9
              }
            }
            wrapper.instance().handleContentCreated(tlmData)
            expect(wrapper.state('timeline')[wrapper.state('timeline').length - 1].content_id).to.equal(tlmData.content.content_id)
          })

          it('should not update the timeline if is not related to the current html-document', () => {
            const tlmDataOtherContent = {
              content: {
                ...commentTlm,
                parent_id: contentHtmlDocument.htmlDocument.content_id + 1,
                content_id: 12
              }
            }
            const oldTimelineLength = wrapper.state('timeline').length
            wrapper.instance().handleContentCreated(tlmDataOtherContent)

            expect(wrapper.state('timeline').length).to.equal(oldTimelineLength)
          })

          it('should sort the timeline if two TracimLiveMessages arrive in the wrong order', () => {
            const tlmData1 = {
              content: {
                ...commentTlm,
                parent_id: contentHtmlDocument.htmlDocument.content_id,
                content_id: 10,
                created: '2020-05-22T14:02:02Z'
              }
            }

            const tlmData2 = {
              content: {
                ...commentTlm,
                parent_id: contentHtmlDocument.htmlDocument.content_id,
                content_id: 11,
                created: '2020-05-22T14:02:05Z'
              }
            }

            wrapper.instance().handleContentCreated(tlmData2)
            wrapper.instance().handleContentCreated(tlmData1)
            expect(wrapper.state('timeline')[wrapper.state('timeline').length - 1].content_id).to.equal(tlmData2.content.content_id)

            expect(wrapper.state('timeline')[wrapper.state('timeline').length - 2].content_id).to.equal(tlmData1.content.content_id)

          })
        })
      })

      describe('handleContentModified', () => {
        describe('modify the content name', () => {
          const tlmData = {
            author: contentHtmlDocument.htmlDocument.last_modifier,
            content: {
              ...contentHtmlDocument.htmlDocument,
              label: 'newContentName'
            }
          }

          before(() => {
            wrapper.instance().handleContentModified(tlmData)
          })

          it('should update the document with the new name', () => {
            expect(wrapper.state('content').label).to.equal(tlmData.content.label)
          })
        })

        describe('modify the content of the html-document', () => {
          const tlmData = {
            author: contentHtmlDocument.htmlDocument.last_modifier,
            content: {
              ...contentHtmlDocument.htmlDocument,
              raw_content: '<p>Html Document Content</p>'
            }
          }

          it('should update the document with the new content', () => {
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
              ...contentHtmlDocument.htmlDocument,
              raw_content: '<p>Html Document content on other doc</p>',
              content_id: contentHtmlDocument.htmlDocument.content_id + 1
            }
          }

          it('should not update when the modification that do not concern the current content', () => {
            wrapper.instance().handleContentModified(tlmData)
            expect(wrapper.state('content').raw_content).to.not.equal(tlmData.content.raw_content)
          })
        })
      })

      describe('handleContentDeleted', () => {
        describe('delete the current content', () => {
          const tlmData = {
            author: contentHtmlDocument.htmlDocument.last_modifier,
            content: contentHtmlDocument.htmlDocument
          }

          after(() => {
            wrapper.setState({ content: contentHtmlDocument.htmlDocument })
          })

          it('should be deleted correctly', () => {
            wrapper.instance().handleContentDeleted(tlmData)
            expect(wrapper.state('content').is_deleted).to.equal(true)
          })
        })

        describe('delete a content which is not the current one', () => {
          const tlmData = {
            content: {
              ...contentHtmlDocument.htmlDocument,
              content_id: contentHtmlDocument.htmlDocument.content_id + 1
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
            author: contentHtmlDocument.htmlDocument.last_modifier,
            content: contentHtmlDocument.htmlDocument
          }

          after(() => {
            wrapper.setState({ content: contentHtmlDocument.htmlDocument })
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
              ...contentHtmlDocument.htmlDocument,
              content_id: contentHtmlDocument.htmlDocument.content_id + 1
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
