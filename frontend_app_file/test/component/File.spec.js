import React from 'react'
import { shallow } from 'enzyme'
import { File } from '../../src/container/File.jsx'
import { expect } from 'chai'
import {
  mockGetFileContent200,
  mockPutMyselfFileRead200,
  mockGetFileComment200,
  mockGetShareLinksList200,
  mockGetFileRevision200
} from '../apiMock.js'
import { APP_FEATURE_MODE } from 'tracim_frontend_lib'
import contentFile from '../fixture/content/contentFile.js'
import { debug } from '../../src/debug.js'
import { commentTlm } from 'tracim_frontend_lib/dist/tracim_frontend_lib.test_utils.js'

describe('<File />', () => {
  const props = {
    setApiUrl: () => {},
    buildTimelineFromCommentAndRevision: (commentList, revisionList) => [...commentList, ...revisionList],
    registerLiveMessageHandlerList: () => {},
    registerCustomEventHandlerList: () => {},
    i18n: {},
    content: contentFile,
    t: key => key
  }

  mockGetFileContent200(debug.config.apiUrl, contentFile.file.workspace_id, contentFile.file.content_id, contentFile.file)
  mockPutMyselfFileRead200(debug.config.apiUrl, contentFile.file.workspace_id, contentFile.file.content_id)
  mockGetShareLinksList200(debug.config.apiUrl, contentFile.file.workspace_id, contentFile.file.content_id, contentFile.shareList)
  mockGetFileComment200(debug.config.apiUrl, contentFile.file.workspace_id, contentFile.file.content_id, contentFile.commentList).persist()
  mockGetFileRevision200(debug.config.apiUrl, contentFile.file.workspace_id, contentFile.file.content_id, contentFile.revisionList).persist()

  const wrapper = shallow(<File {...props} />)

  describe('TLM Handlers', () => {
    describe('eventType content', () => {
      describe('handleContentCreated', () => {
        describe('Create a new comment', () => {
          const tlmData = {
            author: {
              avatar_url: null,
              public_name: 'Global manager',
              user_id: 1
            },
            content: {
              ...commentTlm,
              parent_id: contentFile.file.content_id,
              content_id: 9
            }
          }

          before(() => {
            wrapper.instance().handleContentCommentCreated(tlmData)
          })

          it('should have the new comment in the Timeline', () => {
            expect(wrapper.state('timeline')[wrapper.state('timeline').length - 1].content_id).to.equal(tlmData.content.content_id)
          })
        })

        describe('Create 2 comments received in the wrong time order', () => {
          const tlmData1 = {
            content: {
              ...commentTlm,
              parent_id: contentFile.file.content_id,
              content_id: 10,
              created: '2020-05-22T14:02:02Z'
            }
          }

          const tlmData2 = {
            content: {
              ...commentTlm,
              parent_id: contentFile.file.content_id,
              content_id: 11,
              created: '2020-05-22T14:02:05Z'
            }
          }

          before(function () {
            wrapper.instance().handleContentCommentCreated(tlmData2)
            wrapper.instance().handleContentCommentCreated(tlmData1)
          })

          it('should have correctly order the timeline with the last comment created at the end', () => {
            expect(wrapper.state('timeline')[wrapper.state('timeline').length - 1].content_id).to.equal(tlmData2.content.content_id)
          })
          it('should have correctly order the timeline with the second last comment created not at the end', () => {
            expect(wrapper.state('timeline')[wrapper.state('timeline').length - 2].content_id).to.equal(tlmData1.content.content_id)
          })
        })

        describe('Create a comment not related to the current file', () => {
          const tlmData = {
            content: {
              ...commentTlm,
              parent_id: contentFile.file.content_id + 1,
              content_id: 12
            }
          }
          let oldTimelineLength = 0

          before(() => {
            oldTimelineLength = wrapper.state('timeline').length
            wrapper.instance().handleContentCommentCreated(tlmData)
          })

          it('should not modify the timeline', () => {
            expect(wrapper.state('timeline').length).to.equal(oldTimelineLength)
          })
        })
      })
      describe('handleContentModified', () => {
        describe('Modify the fileName of the current content', () => {
          const tlmData = {
            content: {
              ...contentFile.file,
              filename: 'newName.jpeg'
            }
          }

          before(() => {
            wrapper.instance().handleContentModified(tlmData)
          })

          it('should be updated with the content modified', () => {
            expect(wrapper.state('content').filename).to.equal(tlmData.content.filename)
          })
        })

        describe('Modify the description of the current content', () => {
          const tlmData = {
            content: {
              ...contentFile.file,
              raw_content: 'new random description'
            }
          }

          before(() => {
            wrapper.instance().handleContentModified(tlmData)
          })

          it('should be updated with the content modified', () => {
            expect(wrapper.state('content').raw_content).to.equal(tlmData.content.raw_content)
          })
        })

        describe('Upload a new file to the current content', () => {
          const tlmData = {
            content: {
              ...contentFile.file,
              size: 42,
              filename: 'New File.jpeg',
              current_revision_id: contentFile.file.current_revision_id + 1,
              file_extension: '.jpeg',
              label: 'New File',
              slug: 'newFile',
              created: '2020-05-20T12:15:57Z',
              page_nb: 3,
              modified: '2020-05-20T12:15:57Z',
              mimetype: 'image/jpeg'
            }
          }

          before(() => {
            wrapper.instance().handleContentModified(tlmData)
          })

          it('should have the new filename', () => {
            expect(wrapper.state('content').filename).to.equal(tlmData.content.filename)
          })
          it('should have the new size', () => {
            expect(wrapper.state('content').size).to.equal(tlmData.content.size)
          })
          it('should have the new created date', () => {
            expect(wrapper.state('content').created).to.equal(tlmData.content.created)
          })
          it('should have the new page_nb', () => {
            expect(wrapper.state('content').page_nb).to.equal(tlmData.content.page_nb)
          })
          it('should have build the new previewUrl', () => {
            expect(wrapper.state('content').previewUrl).to.equal('http://localhost:1337/workspaces/0/files/0/revisions/137/preview/jpg/500x500/New File.jpg?page=1')
          })
          it('should have 3 preview pages', () => {
            expect(wrapper.state('content').lightboxUrlList.length).to.equal(3)
          })
        })

        describe('Modify a content not related to the current file', () => {
          const tlmData = {
            content: {
              ...contentFile.file,
              filename: 'WrongName.jpeg',
              content_id: contentFile.file.content_id + 1
            }
          }

          before(() => {
            wrapper.instance().handleContentModified(tlmData)
          })

          it('should not be updated when the modification do not concern the current file', () => {
            expect(wrapper.state('content').filename).to.not.equal(tlmData.content.filename)
          })
        })
      })
      describe('handleContentDeleted', () => {
        describe('Delete the current content', () => {
          const tlmData = {
            content: contentFile.file
          }

          before(() => {
            wrapper.instance().handleContentDeleted(tlmData)
          })

          after(() => {
            wrapper.setState({ content: contentFile.file })
          })

          it('should be deleted correctly', () => {
            expect(wrapper.state('content').is_deleted).to.equal(true)
          })
          it('should be in view mode', () => {
            expect(wrapper.state('mode')).to.equal(APP_FEATURE_MODE.VIEW)
          })
        })

        describe('Delete a content which is not the current one', () => {
          const tlmData = {
            content: {
              ...contentFile.file,
              content_id: contentFile.file.content_id + 1
            }
          }

          before(() => {
            wrapper.instance().handleContentDeleted(tlmData)
          })

          it('should not be deleted', () => {
            expect(wrapper.state('content').is_deleted).to.equal(false)
          })
        })
      })
      describe('handleContentRestored', () => {
        describe('Restore the current content', () => {
          const tlmData = {
            content: contentFile.file
          }

          before(() => {
            wrapper.setState(prev => ({ content: { ...prev.content, is_deleted: true } }))
            wrapper.instance().handleContentRestored(tlmData)
          })

          after(() => {
            wrapper.setState({ content: contentFile.file })
          })

          it('should be restored correctly', () => {
            expect(wrapper.state('content').is_deleted).to.equal(false)
          })
        })

        describe('Restore a content which is not the current one', () => {
          const tlmData = {
            content: {
              ...contentFile.file,
              content_id: contentFile.file.content_id + 1
            }
          }

          before(() => {
            wrapper.setState(prev => ({ content: { ...prev.content, is_deleted: true } }))
            wrapper.instance().handleContentRestored(tlmData)
          })

          it('should not be restored', () => {
            expect(wrapper.state('content').is_deleted).to.equal(true)
          })
        })
      })
    })
  })
})
