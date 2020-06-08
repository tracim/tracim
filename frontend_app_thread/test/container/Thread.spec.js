import React from 'react'
import { shallow } from 'enzyme'
import { Thread } from '../src/container/Thread.jsx'
import { expect } from 'chai'
import {
  mockGetThreadContent200,
  mockGetThreadComment200,
  mockGetThreadRevision200,
  mockPutMyselfThreadRead200
} from './apiMock.js'
import { contentThread } from './fixture/contentThread.js'
import { commentTlm, author } from 'tracim_frontend_lib/dist/tracim_frontend_lib.test_utils.js'
import { debug } from '../src/debug.js'

describe('<Thread />', () => {
  const props = {
    setApiUrl: () => {},
    buildTimelineFromCommentAndRevision: (commentList, revisionList) => [...commentList, ...revisionList],
    registerLiveMessageHandlerList: () => {},
    registerCustomEventHandlerList: () => {},
    i18n: {},
    content: contentThread,
    loggedUser: {
      user_id: 1
    },
    t: key => key
  }

  mockGetThreadContent200(debug.config.apiUrl, contentThread.thread.workspace_id, contentThread.thread.content_id, contentThread.thread)
  mockPutMyselfThreadRead200(debug.config.apiUrl, props.loggedUser.user_id, contentThread.thread.workspace_id, contentThread.thread.content_id)
  mockGetThreadComment200(debug.config.apiUrl, contentThread.thread.workspace_id, contentThread.thread.content_id, contentThread.commentList)
  mockGetThreadRevision200(debug.config.apiUrl, contentThread.thread.workspace_id, contentThread.thread.content_id, contentThread.revisionList)

  const wrapper = shallow(<Thread {...props} />)

  describe('TLM Handlers', () => {
    describe('eventType content', () => {
      const baseCommentTlm = {
        author: author,
        content: commentTlm
      }
      const baseRevisionTlm = {
        author: author,
        content: contentThread.thread
      }

      describe('handleCommentCreated', () => {
        const tlmData = {
          ...baseCommentTlm,
          content: {
            ...commentTlm,
            parent_id: contentThread.thread.content_id,
            content_id: 9,
            created: '2022-06-09T10:28:43.511Z',
          }
        }

        before(() => {
          wrapper.instance().handleCommentCreated(tlmData)
        })

        it('should have the new comment in the Timeline', () => {
          expect(wrapper.state('timeline').find(t => t.content_id === 9)).to.not.equal(undefined)
        })

        // TODO - CH - 2020-06-05 - need to use the real buildTimelineFromCommentAndRevision function (not mocked)
        // see https://github.com/tracim/tracim/issues/3143
        // describe('Create 2 comments received in the wrong time order', () => {
        //   const tlmData1 = {
        //     content: {
        //       ...commentTlm,
        //       parent_id: contentThread.thread.content_id,
        //       content_id: 10,
        //       created: '2020-05-22T14:02:02Z'
        //     }
        //   }
        //
        //   const tlmData2 = {
        //     content: {
        //       ...commentTlm,
        //       parent_id: contentThread.thread.content_id,
        //       content_id: 11,
        //       created: '2020-05-22T14:02:05Z'
        //     }
        //   }
        //
        //   before(function () {
        //     wrapper.instance().handleCommentCreated(tlmData2)
        //     wrapper.instance().handleCommentCreated(tlmData1)
        //   })
        //
        //   const timelineLength = wrapper.state('timeline').length
        //   it('should have correctly order the timeline with the last comment created at the end', () => {
        //     expect(wrapper.state('timeline')[timelineLength - 1].content_id).to.equal(tlmData2.content.content_id)
        //   })
        //   it('should have correctly order the timeline with the second last comment created not at the end', () => {
        //     expect(wrapper.state('timeline')[timelineLength - 2].content_id).to.equal(tlmData1.content.content_id)
        //   })
        // })

        describe('Create a comment not related to the current thread', () => {
          const tlmData = {
            ...baseCommentTlm,
            content: {
              ...baseCommentTlm.content,
              parent_id: contentThread.thread.content_id + 1,
              content_id: 12
            }
          }
          let oldTimelineLength = 0

          before(() => {
            oldTimelineLength = wrapper.state('timeline').length
            wrapper.instance().handleCommentCreated(tlmData)
          })

          it('should not modify the timeline', () => {
            expect(wrapper.state('timeline').length).to.equal(oldTimelineLength)
          })
        })
      })

      describe('handleContentModified', () => {
        describe('Modify the label of the current content', () => {
          const tlmData = {
            ...baseRevisionTlm,
            content: {
              ...baseRevisionTlm.content,
              label: 'new label'
            }
          }

          before(() => {
            wrapper.instance().handleContentModified(tlmData)
          })

          it('should update the state label', () => {
            expect(wrapper.state('content').label).to.equal(tlmData.content.label)
          })
        })

        describe('Modify the description of the current content', () => {
          const tlmData = {
            ...baseRevisionTlm,
            content: {
              ...contentThread.thread,
              raw_content: 'new random description'
            }
          }

          before(() => {
            wrapper.instance().handleContentModified(tlmData)
          })

          it('should update the state "raw_content"', () => {
            expect(wrapper.state('content').raw_content).to.equal(tlmData.content.raw_content)
          })
        })

        describe('Modify a content not related to the current thread', () => {
          const tlmData = {
            ...baseRevisionTlm,
            content: {
              ...baseRevisionTlm.content,
              content_id: contentThread.thread.content_id + 1
            }
          }

          before(() => {
            wrapper.instance().handleContentModified(tlmData)
          })

          it('should not update the state', () => {
            expect(wrapper.state('content').content_id).to.not.equal(tlmData.content.content_id)
          })
        })
      })

      describe('handleContentDeleted', () => {
        describe('Delete the current content', () => {
          const tlmData = baseRevisionTlm

          before(() => {
            wrapper.instance().handleContentDeleted(tlmData)
          })

          after(() => {
            wrapper.setState({ content: contentThread.thread })
          })

          it('should update the is_deleted property', () => {
            expect(wrapper.state('content').is_deleted).to.equal(true)
          })
        })

        describe('Delete a content which is not the current one', () => {
          const tlmData = {
            ...baseRevisionTlm,
            content: {
              ...baseRevisionTlm.content,
              content_id: contentThread.thread.content_id + 1
            }
          }

          before(() => {
            wrapper.instance().handleContentDeleted(tlmData)
          })

          it('should not update the state', () => {
            expect(wrapper.state('content').is_deleted).to.equal(false)
          })
        })
      })

      describe('handleContentRestored', () => {
        describe('Restore the current content', () => {
          const tlmData = baseRevisionTlm

          before(() => {
            wrapper.setState(prev => ({ content: { ...prev.content, is_deleted: true } }))
            wrapper.instance().handleContentUndeleted(tlmData)
          })

          after(() => {
            wrapper.setState({ content: contentThread.thread })
          })

          it('should update the state is_deleted', () => {
            expect(wrapper.state('content').is_deleted).to.equal(false)
          })
        })

        describe('Restore a content which is not the current one', () => {
          const tlmData = {
            ...baseRevisionTlm,
            content: {
              ...baseRevisionTlm.content,
              content_id: contentThread.thread.content_id + 1
            }
          }

          before(() => {
            wrapper.setState(prev => ({ content: { ...prev.content, is_deleted: true } }))
            wrapper.instance().handleContentUndeleted(tlmData)
          })

          it('should not update the state', () => {
            expect(wrapper.state('content').is_deleted).to.equal(true)
          })
        })
      })
    })
  })
})
