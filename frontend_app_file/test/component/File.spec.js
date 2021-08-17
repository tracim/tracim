import React from 'react'
import { shallow } from 'enzyme'
import { File } from '../../src/container/File.jsx'
import { expect } from 'chai'
import sinon from 'sinon'
import {
  mockGetFileContent200,
  mockPutMyselfFileRead200,
  mockGetFileComment200,
  mockGetShareLinksList200,
  mockGetFileRevision200,
  mockPutUserConfiguration204
} from '../apiMock.js'
import { APP_FEATURE_MODE } from 'tracim_frontend_lib'
import contentFile from '../fixture/content/contentFile.js'
import { debug } from '../../src/debug.js'
import { commentTlm, user } from 'tracim_frontend_lib/dist/tracim_frontend_lib.test_utils.js'

debug.config.apiUrl = 'http://unit.test:6543/api'

describe('<File />', () => {
  const props = {
    setApiUrl: () => { },
    buildTimelineFromCommentAndRevision: (commentList, revisionList) => [...commentList, ...revisionList],
    addCommentToTimeline: sinon.spy((comment, timeline, loggedUser) => timeline),
    registerLiveMessageHandlerList: () => { },
    registerCustomEventHandlerList: () => { },
    i18n: {},
    content: contentFile,
    t: key => key,
    isContentInFavoriteList: () => false,
    loadFavoriteContentList: () => {}
  }
  const buildBreadcrumbsSpy = sinon.spy()
  const setHeadTitleSpy = sinon.spy()

  mockGetFileContent200(debug.config.apiUrl, contentFile.file.workspace_id, contentFile.file.content_id, contentFile.file)
  mockPutMyselfFileRead200(debug.config.apiUrl, contentFile.file.workspace_id, contentFile.file.content_id)
  mockGetShareLinksList200(debug.config.apiUrl, contentFile.file.workspace_id, contentFile.file.content_id, contentFile.shareList)
  mockGetFileComment200(debug.config.apiUrl, contentFile.file.workspace_id, contentFile.file.content_id, contentFile.commentList).persist()
  mockGetFileRevision200(debug.config.apiUrl, contentFile.file.workspace_id, contentFile.file.content_id, contentFile.revisionList).persist()

  const wrapper = shallow(<File {...props} />)
  wrapper.instance().buildBreadcrumbs = buildBreadcrumbsSpy
  wrapper.instance().setHeadTitle = setHeadTitleSpy

  const resetSpiesHistory = () => {
    buildBreadcrumbsSpy.resetHistory()
    setHeadTitleSpy.resetHistory()
  }

  describe('TLM Handlers', () => {
    describe('eventType content', () => {
      describe('handleContentCreated', () => {
        describe('Create a new comment', () => {
          it('should call addCommentToTimeline', () => {
            const tlmData = {
              fields: {
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
            }
            wrapper.instance().handleContentCommentCreated(tlmData)
            expect(props.addCommentToTimeline.calledOnce).to.equal(true)
          })
        })

        describe('Create a comment not related to the current file', () => {
          const tlmData = {
            fields: {
              content: {
                ...commentTlm,
                parent_id: contentFile.file.content_id + 1,
                content_id: 12
              }
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
            fields: {
              content: {
                ...contentFile.file,
                filename: 'newName.jpeg'
              },
              author: contentFile.file.author,
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

          it('should be updated with the content modified', () => {
            expect(wrapper.state('newContent').filename).to.equal(tlmData.fields.content.filename)
          })
          it('should have the new revision in the timeline', () => {
            expect(wrapper.state('timeline')[wrapper.state('timeline').length - 1].filename).to.equal(tlmData.fields.content.filename)
          })
          it('should have called buildBreadcrumbs()', () => {
            expect(buildBreadcrumbsSpy.calledOnce).to.equal(true)
          })
          it('should have called setHeadTitle() with the right args', () => {
            expect(setHeadTitleSpy.calledOnce).to.equal(true)
          })
        })

        describe('Modify the description of the current content', () => {
          const tlmData = {
            fields: {
              content: {
                ...contentFile.file,
                description: 'new random description'
              },
              author: contentFile.file.author
            }
          }

          before(() => {
            wrapper.instance().handleContentModified(tlmData)
          })

          it('should be updated with the content modified', () => {
            expect(wrapper.state('newContent').description).to.equal(tlmData.fields.content.description)
          })
          it('should have the new revision in the timeline', () => {
            expect(wrapper.state('timeline')[wrapper.state('timeline').length - 1].description).to.equal(tlmData.fields.content.description)
          })
        })

        describe('Upload a new file to the current content', () => {
          const tlmData = {
            fields: {
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
              },
              user: contentFile.file.author,
              author: contentFile.file.author
            }
          }

          before(() => {
            wrapper.instance().handleContentModified(tlmData)
          })

          it('should have the new filename', () => {
            expect(wrapper.state('newContent').filename).to.equal(tlmData.fields.content.filename)
          })
          it('should have the new size', () => {
            expect(wrapper.state('newContent').size).to.equal(tlmData.fields.content.size)
          })
          it('should have the new created date', () => {
            expect(wrapper.state('newContent').created).to.equal(tlmData.fields.content.created)
          })
          it('should have the new page_nb', () => {
            expect(wrapper.state('newContent').page_nb).to.equal(tlmData.fields.content.page_nb)
          })
          it('should have the new previewUrl', () => {
            expect(wrapper.state('newContent').previewUrl).to.equal(debug.config.apiUrl + '/workspaces/0/files/0/revisions/137/preview/jpg/500x500/New%20File.jpg?page=1')
          })
          it('should have 3 preview pages', () => {
            expect(wrapper.state('newContent').lightboxUrlList.length).to.equal(3)
          })
        })

        describe('Modify a content not related to the current file', () => {
          const tlmData = {
            fields: {
              content: {
                ...contentFile.file,
                filename: 'WrongName.jpeg',
                content_id: contentFile.file.content_id + 1
              }
            }
          }

          before(() => {
            wrapper.instance().handleContentModified(tlmData)
          })

          it('should not be updated when the modification do not concern the current file', () => {
            expect(wrapper.state('content').filename).to.not.equal(tlmData.fields.content.filename)
          })
        })
      })
      describe('handleContentDeletedOrRestored', () => {
        describe('Delete the current content', () => {
          const tlmData = {
            fields: {
              content: {
                ...contentFile.file,
                is_deleted: true
              },
              author: contentFile.file.author
            }
          }

          before(() => {
            wrapper.instance().handleContentDeletedOrRestored(tlmData)
          })

          after(() => {
            wrapper.setState({ content: contentFile.file })
          })

          it('should be deleted correctly', () => {
            expect(wrapper.state('newContent').is_deleted).to.equal(true)
          })
          it('should have the new revision in the timeline', () => {
            expect(wrapper.state('timeline')[wrapper.state('timeline').length - 1].is_deleted).to.equal(true)
          })
        })

        describe('Delete a content which is not the current one', () => {
          const tlmData = {
            fields: {
              content: {
                ...contentFile.file,
                content_id: contentFile.file.content_id + 1,
                is_deleted: true
              }
            }
          }

          before(() => {
            wrapper.instance().handleContentDeletedOrRestored(tlmData)
          })

          it('should not be deleted', () => {
            expect(wrapper.state('content').is_deleted).to.equal(false)
          })
        })

        describe('Restore the current content', () => {
          const tlmData = {
            fields: {
              content: {
                ...contentFile.file,
                is_deleted: false
              },
              author: contentFile.file.author
            }
          }

          before(() => {
            wrapper.setState(prev => ({ content: { ...prev.content, is_deleted: true } }))
            wrapper.instance().handleContentDeletedOrRestored(tlmData)
          })

          after(() => {
            wrapper.setState({ content: contentFile.file })
          })

          it('should be restored correctly', () => {
            expect(wrapper.state('newContent').is_deleted).to.equal(false)
          })
          it('should have the new revision in the timeline', () => {
            expect(wrapper.state('timeline')[wrapper.state('timeline').length - 1].is_deleted).to.equal(false)
          })
        })

        describe('Restore a content which is not the current one', () => {
          const tlmData = {
            fields: {
              content: {
                ...contentFile.file,
                content_id: contentFile.file.content_id + 1,
                is_deleted: false
              }
            }
          }

          before(() => {
            wrapper.setState(prev => ({ content: { ...prev.content, is_deleted: true } }))
            wrapper.instance().handleContentDeletedOrRestored(tlmData)
          })

          it('should not be restored', () => {
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
        wrapper.setState(prev => ({ newContent: { ...prev.content, filename: 'New Name' } }))
        wrapper.instance().handleClickRefresh()
        expect(wrapper.state('content')).to.deep.equal(wrapper.state('newContent'))
      })
      it('should update showRefreshWarning state', () => {
        wrapper.instance().handleClickRefresh()
        expect(wrapper.state('showRefreshWarning')).to.deep.equal(false)
      })
      it('should be in view mode', () => {
        expect(wrapper.state('mode')).to.equal(APP_FEATURE_MODE.VIEW)
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
        newConfig[`content.${props.content.file.content_id}.notify_all_members_message`] = false
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

      it('should return true if user configuration content_id.notify_all_members_message is true', () => {
        const newConfig = { ...wrapper.state('loggedUser').config }
        newConfig[`content.${props.content.file.content_id}.notify_all_members_message`] = true
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
        expect(wrapper.instance().shouldDisplayNotifyAllMessage()).to.equal(true)
      })
    })

    describe('handleCloseNotifyAllMessage', () => {
      it('should set content_id.notify_all_members_message as false', () => {
        mockPutUserConfiguration204(debug.config.apiUrl, debug.loggedUser.userId)
        wrapper.instance().handleCloseNotifyAllMessage()
        expect(wrapper.state('loggedUser').config[`content.${props.content.file.content_id}.notify_all_members_message`]).to.equal(false)
      })
    })
  })
})
