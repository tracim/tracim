import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import {
  mockGetHtmlDocumentComment200,
  mockGetHtmlDocumentContent200,
  mockGetHtmlDocumentRevision200,
  mockPutHtmlDocumentRead200,
  mockPutUserConfiguration204
} from '../apiMock.js'
import { commentTlm, user } from 'tracim_frontend_lib/dist/tracim_frontend_lib.test_utils.js'
import { HtmlDocument } from '../../src/container/HtmlDocument.jsx'
import { APP_FEATURE_MODE } from 'tracim_frontend_lib'
import contentHtmlDocument from '../fixture/content/contentHtmlDocument.js'
import { debug } from '../../src/debug.js'

debug.config.apiUrl = 'http://unit.test:6543/api'

describe('<HtmlDocument />', () => {
  const props = {
    buildTimelineFromCommentAndRevision: (commentList, revisionList) => [...commentList, ...revisionList],
    addCommentToTimeline: sinon.spy((comment, timeline, loggedUser, hasBeenRead) => timeline),
    content: contentHtmlDocument.htmlDocument,
    i18n: {},
    registerCustomEventHandlerList: () => { },
    registerLiveMessageHandlerList: () => { },
    setApiUrl: () => { },
    t: key => key,
    isContentInFavoriteList: () => false
  }
  const buildBreadcrumbsSpy = sinon.spy()
  const setHeadTitleSpy = sinon.spy()

  mockGetHtmlDocumentContent200(debug.config.apiUrl, props.content.workspace_id, props.content.content_id, props.content)
  mockPutHtmlDocumentRead200(debug.loggedUser.userId, debug.config.apiUrl, props.content.workspace_id, props.content.content_id)
  mockGetHtmlDocumentComment200(debug.config.apiUrl, props.content.workspace_id, props.content.content_id, contentHtmlDocument.commentList).persist()
  mockGetHtmlDocumentRevision200(debug.config.apiUrl, props.content.workspace_id, props.content.content_id, contentHtmlDocument.revisionList).persist()

  const wrapper = shallow(<HtmlDocument {...props} />)
  wrapper.instance().buildBreadcrumbs = buildBreadcrumbsSpy
  wrapper.instance().setHeadTitle = setHeadTitleSpy

  const resetSpiesHistory = () => {
    buildBreadcrumbsSpy.resetHistory()
    setHeadTitleSpy.resetHistory()
  }

  describe('TLM handlers', () => {
    describe('eventType content', () => {
      describe('handleContentCommentCreated', () => {
        describe('create a new comment', () => {
          it('should call addCommentToTimeline if is related to the current html-document', () => {
            const tlmData = {
              fields: {
                content: {
                  ...commentTlm,
                  parent_id: contentHtmlDocument.htmlDocument.content_id,
                  content_id: 9
                }
              }
            }
            props.addCommentToTimeline.resetHistory()
            wrapper.instance().handleContentCommentCreated(tlmData)
            expect(props.addCommentToTimeline.calledOnce).to.equal(true)
          })

          it('should not update the timeline if is not related to the current html-document', () => {
            const tlmDataOtherContent = {
              fields: {
                content: {
                  ...commentTlm,
                  parent_id: contentHtmlDocument.htmlDocument.content_id + 1,
                  content_id: 12
                }
              }
            }
            props.addCommentToTimeline.resetHistory()
            wrapper.instance().handleContentCommentCreated(tlmDataOtherContent)
            expect(props.addCommentToTimeline.calledOnce).to.equal(false)
          })
        })
      })

      describe('handleContentModified', () => {
        describe('modify the content name', () => {
          const tlmData = {
            fields: {
              author: contentHtmlDocument.htmlDocument.last_modifier,
              content: {
                ...contentHtmlDocument.htmlDocument,
                label: 'newContentName'
              },
              client_token: wrapper.state('config').apiHeader['X-Tracim-ClientToken']
            }
          }

          before(() => {
            resetSpiesHistory()
            wrapper.instance().handleContentModified(tlmData)
          })

          after(() => {
            resetSpiesHistory()
          })

          it('should update the document with the new name', () => {
            expect(wrapper.state('newContent').label).to.equal(tlmData.fields.content.label)
          })
          it('should call buildBreadcrumbs()', () => {
            expect(buildBreadcrumbsSpy.called).to.equal(true)
          })
          it('should call setHeadTitle() with the right args', () => {
            expect(setHeadTitleSpy.calledOnceWith(tlmData.fields.content.label)).to.equal(true)
          })
        })

        describe('modify the content of the html-document', () => {
          const tlmData = {
            fields: {
              author: contentHtmlDocument.htmlDocument.last_modifier,
              content: {
                ...contentHtmlDocument.htmlDocument,
                raw_content: '<p>Html Document Content</p>'
              }
            }
          }

          it('should update the document with the new content', () => {
            wrapper.instance().handleContentModified(tlmData)
            expect(wrapper.state('newContent').raw_content).to.equal(tlmData.fields.content.raw_content)
          })

          it('should stay in edit mode if the user is editing', () => {
            wrapper.setState({ mode: APP_FEATURE_MODE.EDIT })
            wrapper.instance().handleContentModified(tlmData)

            expect(wrapper.state('showRefreshWarning')).to.equal(true)
            expect(wrapper.state('mode')).to.equal(APP_FEATURE_MODE.EDIT)
          })

          it('should display the right version number', () => {
            wrapper.setState({ mode: APP_FEATURE_MODE.REVISION })
            const oldRevisionNumber = wrapper.state('timeline').filter(t => t.timelineType === 'revision' && t.hasBeenRead).length
            wrapper.instance().handleContentModified(tlmData)
            expect(wrapper.state('content').number).to.equal(oldRevisionNumber)
          })
        })

        describe('modify a content not related to another content', () => {
          const tlmData = {
            fields: {
              content: {
                ...contentHtmlDocument.htmlDocument,
                raw_content: '<p>Html Document content on other doc</p>',
                content_id: contentHtmlDocument.htmlDocument.content_id + 1
              }
            }
          }

          it('should not update when the modification that do not concern the current content', () => {
            wrapper.instance().handleContentModified(tlmData)
            expect(wrapper.state('newContent').raw_content).to.not.equal(tlmData.fields.content.raw_content)
          })
        })
      })

      describe('handleContentDeletedOrRestore', () => {
        describe('when deleting the current content', () => {
          const tlmData = {
            fields: {
              author: contentHtmlDocument.htmlDocument.last_modifier,
              content: { ...contentHtmlDocument.htmlDocument, is_deleted: true }
            }
          }

          after(() => {
            wrapper.setState({ content: contentHtmlDocument.htmlDocument })
          })

          it('should be deleted correctly', () => {
            wrapper.instance().handleContentDeletedOrRestore(tlmData)
            expect(wrapper.state('newContent').is_deleted).to.equal(true)
          })

          it('should display the right version number', () => {
            wrapper.setState({ mode: APP_FEATURE_MODE.REVISION })
            const oldRevisionNumber = wrapper.state('timeline').filter(t => t.timelineType === 'revision' && t.hasBeenRead).length
            wrapper.instance().handleContentModified(tlmData)
            expect(wrapper.state('content').number).to.equal(oldRevisionNumber)
          })
        })

        describe('when deleting a content which is not the current one', () => {
          const tlmData = {
            fields: {
              content: {
                ...contentHtmlDocument.htmlDocument,
                content_id: contentHtmlDocument.htmlDocument.content_id + 1,
                is_deleted: true
              }
            }
          }

          it('should not be deleted', () => {
            wrapper.instance().handleContentDeletedOrRestore(tlmData)
            expect(wrapper.state('content').is_deleted).to.equal(false)
          })
        })

        describe('when restoring the current content', () => {
          const tlmData = {
            fields: {
              author: contentHtmlDocument.htmlDocument.last_modifier,
              content: { ...contentHtmlDocument.htmlDocument, is_deleted: false }
            }
          }

          after(() => {
            wrapper.setState({ content: contentHtmlDocument.htmlDocument })
          })

          it('should be restored correctly', () => {
            wrapper.setState(prev => ({ content: { ...prev.content, is_deleted: true } }))
            wrapper.instance().handleContentDeletedOrRestore(tlmData)

            expect(wrapper.state('newContent').is_deleted).to.equal(false)
          })
        })

        describe('restore a content which is not the current one', () => {
          const tlmData = {
            fields: {
              content: {
                ...contentHtmlDocument.htmlDocument,
                content_id: contentHtmlDocument.htmlDocument.content_id + 1,
                is_deleted: false
              }
            }
          }

          it('should not be restored', () => {
            wrapper.setState(prev => ({ content: { ...prev.content, is_deleted: true } }))
            wrapper.instance().handleContentDeletedOrRestore(tlmData)

            expect(wrapper.state('content').is_deleted).to.equal(true)
          })
        })
      })
    })

    describe('eventType user', () => {
      describe('handleUserModified', () => {
        describe('If the user is the author of a revision or comment', () => {
          it('should update the timeline with the data of the user', () => {
            const tlmData = { fields: { user: { ...user, public_name: 'newName' } } }
            wrapper.instance().handleUserModified(tlmData)

            const listPublicNameOfAuthor = wrapper.state('timeline')
              .filter(timelineItem => timelineItem.author.user_id === tlmData.fields.user.user_id)
              .map(timelineItem => timelineItem.author.public_name)
            const isNewName = listPublicNameOfAuthor.every(publicName => publicName === tlmData.fields.user.public_name)
            expect(isNewName).to.be.equal(true)
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

      it('should update showRefreshWarning state', () => {
        wrapper.instance().handleClickRefresh()
        expect(wrapper.state('showRefreshWarning')).to.deep.equal(false)
      })
    })

    describe('shouldDisplayNotifyAllMessage', () => {
      it("should return false if loggedUser don't have config", () => {
        wrapper.setState(prev => ({ loggedUser: { ...prev.loggedUser, config: null } }))
        expect(wrapper.instance().shouldDisplayNotifyAllMessage()).to.equal(false)
      })

      it('should return false if content.current_revision_type is creation', () => {
        wrapper.setState(prev => ({
          loggedUser: { ...prev.loggedUser, config: { param: 'value' } },
          content: {
            ...prev.content,
            current_revision_type: 'creation'
          }
        }))
        expect(wrapper.instance().shouldDisplayNotifyAllMessage()).to.equal(false)
      })

      it('should return false if content last modifier is not the logged user and there in no newContent', () => {
        wrapper.setState(prev => ({
          loggedUser: { ...prev.loggedUser, config: { param: 'value' } },
          content: {
            ...prev.content,
            current_revision_type: 'edition',
            last_modifier: {
              user_id: prev.loggedUser.userId + 1
            }
          },
          newContent: {}
        }))
        expect(wrapper.instance().shouldDisplayNotifyAllMessage()).to.equal(false)
      })

      it('should return false if content last modifier is not the logged user at the newContent', () => {
        wrapper.setState(prev => ({
          loggedUser: { ...prev.loggedUser, config: { param: 'value' } },
          newContent: {
            ...prev.newContent,
            last_modifier: {
              user_id: prev.loggedUser.userId + 1
            }
          }
        }))
        expect(wrapper.instance().shouldDisplayNotifyAllMessage()).to.equal(false)
      })

      it('should return false if user configuration content_id.notify_all_members_message is false', () => {
        const newConfig = { ...wrapper.state('loggedUser').config }
        newConfig[`content.${props.content.content_id}.notify_all_members_message`] = false
        wrapper.setState(prev => ({
          ...prev,
          newContent: {
            ...prev.newContent,
            last_modifier: {
              ...prev.newContent.last_modifier,
              user_id: prev.loggedUser.userId
            }
          },
          content: {
            ...prev.content,
            current_revision_type: 'edition',
            last_modifier: {
              ...prev.content.last_modifier,
              user_id: prev.loggedUser.userId
            }
          },
          loggedUser: {
            ...prev.loggedUser,
            config: newConfig
          }
        }))
        expect(wrapper.instance().shouldDisplayNotifyAllMessage()).to.equal(false)
      })

      it('should return false if the app mode is not VIEW', () => {
        wrapper.setState(prev => ({
          ...prev,
          mode: APP_FEATURE_MODE.EDIT
        }))
        expect(wrapper.instance().shouldDisplayNotifyAllMessage()).to.equal(false)
      })

      it('should return true if user configuration content_id.notify_all_members_message is true', () => {
        const newConfig = { ...wrapper.state('loggedUser').config }
        newConfig[`content.${props.content.content_id}.notify_all_members_message`] = true
        wrapper.setState(prev => ({
          ...prev,
          mode: APP_FEATURE_MODE.VIEW,
          newContent: {
            ...prev.newContent,
            last_modifier: {
              ...prev.newContent.last_modifier,
              user_id: prev.loggedUser.userId
            }
          },
          content: {
            ...prev.content,
            current_revision_type: 'edition',
            last_modifier: {
              ...prev.content.last_modifier,
              user_id: prev.loggedUser.userId
            }
          },
          loggedUser: {
            ...prev.loggedUser,
            config: newConfig
          }
        }))
        expect(wrapper.instance().shouldDisplayNotifyAllMessage()).to.equal(true)
      })
    })

    describe('handleCloseNotifyAllMessage', () => {
      it('should set content_id.notify_all_members_message as false', () => {
        mockPutUserConfiguration204(debug.config.apiUrl, debug.loggedUser.userId)
        wrapper.instance().handleCloseNotifyAllMessage()
        expect(wrapper.state('loggedUser').config[`content.${props.content.content_id}.notify_all_members_message`]).to.equal(false)
      })
    })
  })
})
