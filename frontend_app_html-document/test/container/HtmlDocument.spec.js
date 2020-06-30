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
            const hasComment = !!(wrapper.state('timeline').find(content => content.content_id === tlmData.content.content_id))
            expect(hasComment).to.equal(true)
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
            expect(wrapper.state('newContent').label).to.equal(tlmData.content.label)
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
            expect(wrapper.state('newContent').raw_content).to.equal(tlmData.content.raw_content)
          })

          it('should stay in edit mode if the user is editing', () => {
            wrapper.setState({ mode: APP_FEATURE_MODE.EDIT })
            wrapper.instance().handleContentModified(tlmData)

            expect(wrapper.state('receivedUpdate')).to.equal(true)
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
            expect(wrapper.state('newContent').raw_content).to.not.equal(tlmData.content.raw_content)
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

  describe('its internal functions', () => {
    describe('handleClickRefresh', () => {
      it('should update content state', () => {
        wrapper.setState(prev => ({ newContent: { ...prev.content, label: 'New Name' } }))
        wrapper.instance().handleClickRefresh()
        expect(wrapper.state('content').label).to.deep.equal(wrapper.state('newContent').label)
      })

      it('should update mode state', () => {
        wrapper.instance().handleClickRefresh()
        expect(wrapper.state('mode')).to.deep.equal(APP_FEATURE_MODE.VIEW)
      })

      it('should update receivedUpdate state', () => {
        wrapper.instance().handleClickRefresh()
        expect(wrapper.state('receivedUpdate')).to.deep.equal(false)
      })
    })
  })
})
