import React from 'react'
import { expect } from 'chai'
import sinon from 'sinon'
import { mount } from 'enzyme'
import { appContentFactory } from '../src/appContentFactory.js'
import { status } from './fixture/status.js'
import { commentTlm } from './fixture/tracimLiveMessage/commentTlm.js'
import { user } from './fixture/user.js'
import { commentList as fixtureCommentList } from './fixture/contentCommentList.js'
import { revisionList as fixtureRevisionList } from './fixture/contentRevisionList.js'
import { content } from './fixture/content.js'
import { defaultDebug } from '../src/debug.js'
import {
  mockGetMyselfKnownMember200,
  mockPutContent200,
  mockPostContentComment200,
  mockPutContentStatus204,
  mockPutContentArchive204,
  mockPutContentDelete204,
  mockPutContentArchiveRestore204,
  mockPutContentDeleteRestore204
} from './apiMock.js'
import { generateLocalStorageContentId } from '../src/localStorage.js'

describe('appContentFactory.js', () => {
  const fakeCheckApiUrl = sinon.spy()
  global.localStorage = {
    getItem: sinon.spy(),
    setItem: sinon.spy(),
    removeItem: sinon.spy()
  }
  const fakeSetState = sinon.spy()
  const fakeBuildBreadcrumbs = sinon.spy()
  const fakeLoadContent = sinon.spy()
  const fakeLoadTimeline = sinon.spy()

  const DummyComponent = () => <div>I'm empty</div>
  const WrappedDummyComponent = appContentFactory(DummyComponent)
  const root = mount(<WrappedDummyComponent data={defaultDebug} />)
  // INFO - 2021-08-17 - S.G. - get the first child as the root is in fact a TracimComponent() HOC.
  const wrapper = root.childAt(0)

  const fakeContent = {
    ...content,
    workspace_id: 12,
    content_id: 42,
    label: 'unedited label',
    raw_content: 'unedited content',
    status: status.OPEN
  }
  const appContentSlug = 'appContentSlugExample'

  const fakeApiUrl = 'http://fake.url/api'

  mockGetMyselfKnownMember200(fakeApiUrl, fakeContent.workspace_id, ['@user1'])

  describe('The wrapped component', () => {
    it('should have all the new props', () => {
      expect(wrapper.childAt(0).props()).to.include.keys(
        'registerCustomEventHandlerList',
        'registerGlobalLiveMessageHandler',
        'registerLiveMessageHandlerList',
        'setApiUrl',
        'appContentCustomEventHandlerShowApp',
        'appContentCustomEventHandlerHideApp',
        'appContentCustomEventHandlerReloadContent',
        'appContentCustomEventHandlerReloadAppFeatureData',
        'appContentCustomEventHandlerAllAppChangeLanguage',
        'appContentChangeTitle',
        'appContentChangeComment',
        'appContentDeleteComment',
        'appContentEditComment',
        'appContentAddCommentAsFile',
        'appContentNotifyAll',
        'appContentSaveNewComment',
        'appContentRemoveCommentAsFile',
        'appContentChangeStatus',
        'appContentArchive',
        'appContentDelete',
        'appContentRestoreArchive',
        'appContentRestoreDelete',
        'buildTimelineFromCommentAndRevision',
        'searchForMentionOrLinkInQuery',
        'handleTranslateComment',
        'handleRestoreComment',
        'addContentToFavoriteList',
        'isContentInFavoriteList',
        'loadFavoriteContentList',
        'removeContentFromFavoriteList',
        'removeCommentFromTimeline',
        'updateCommentOnTimeline',
        'canFetchMoreTimelineItems',
        'fetchTimelineItems',
        'isLastTimelineItemCurrentToken',
        'resetTimeline',
        'timeline'
      )
    })
  })

  describe('function setApiUrl', () => {
    it('should set the class property apiUrl', () => {
      expect(wrapper.instance().apiUrl).to.equal(null)
      wrapper.instance().setApiUrl(fakeApiUrl)
      expect(wrapper.instance().apiUrl).to.equal(fakeApiUrl)
    })
  })

  describe('function appContentCustomEventHandlerShowApp', () => {
    describe('with the same content id', () => {
      const newContent = { ...fakeContent }

      before(() => {
        wrapper.instance().appContentCustomEventHandlerShowApp(newContent, fakeContent, fakeSetState, fakeBuildBreadcrumbs)
      })

      after(() => {
        fakeSetState.resetHistory()
        fakeBuildBreadcrumbs.resetHistory()
      })

      it('should call setState to show the app', () => {
        sinon.assert.calledWith(fakeSetState, { isVisible: true })
      })

      it('should call buildBreadcrumbs function', () => {
        expect(fakeBuildBreadcrumbs.called).to.equal(true)
      })
    })

    describe('with a different content id', () => {
      const newContent = {
        ...fakeContent,
        content_id: fakeContent.content_id + 1
      }

      before(() => {
        wrapper.instance().appContentCustomEventHandlerShowApp(newContent, fakeContent, fakeSetState, fakeBuildBreadcrumbs)
      })

      after(() => {
        global.GLOBAL_dispatchEvent.resetHistory()
        fakeSetState.resetHistory()
        fakeBuildBreadcrumbs.resetHistory()
      })

      it('should have called neither setState nor buildBreadcrumbs', () => {
        expect(fakeSetState.called).to.equal(false)
        expect(fakeBuildBreadcrumbs.called).to.equal(false)
      })
    })
  })

  describe('function appContentCustomEventHandlerHideApp', () => {
    const fakeTinymceRemove = sinon.spy()

    before(() => {
      global.tinymce.remove = fakeTinymceRemove
      wrapper.instance().appContentCustomEventHandlerHideApp(fakeSetState)
    })

    after(() => {
      fakeTinymceRemove.resetHistory()
      fakeSetState.resetHistory()
    })

    it('should reset the tinymce comment field', () => {
      sinon.assert.calledWith(fakeTinymceRemove, '#wysiwygTimelineComment')
    })

    it('should call setState to hide the app and set back the comment textarea to normal', () => {
      sinon.assert.calledWith(fakeSetState, {
        isVisible: false,
        timelineWysiwyg: false
      })
    })
  })

  describe('function appContentCustomEventHandlerReloadContent', () => {
    const newContent = { ...fakeContent, content_id: fakeContent.content_id + 1 }
    const initialState = { content: fakeContent }
    const fakeTinymceRemove = sinon.spy()

    before(() => {
      global.tinymce.remove = fakeTinymceRemove
      wrapper.instance().setState(initialState)
      wrapper.instance().appContentCustomEventHandlerReloadContent(newContent, fakeSetState, appContentSlug)
      const lastSetStateArg = fakeSetState.lastCall.args[0]
      if (typeof lastSetStateArg === 'function') {
        lastSetStateArg(initialState)
      }
    })

    after(() => {
      fakeTinymceRemove.resetHistory()
      global.localStorage.getItem.resetHistory()
      fakeSetState.resetHistory()
    })

    it('should remove the tinymce comment field', () => {
      sinon.assert.calledWith(fakeTinymceRemove, '#wysiwygTimelineComment')
    })

    it('should get the localStorage value', () => {
      sinon.assert.calledWith(
        global.localStorage.getItem,
        generateLocalStorageContentId(newContent.workspace_id, newContent.content_id, appContentSlug, 'comment')
      )
    })

    it('should call setState to update with the new comment', () => {
      // INFO - CH - 2019-01-07 - I don't know how to do a callWith when setState is called with a function in parameter
      sinon.assert.called(fakeSetState)
    })
  })

  describe('function appContentCustomEventHandlerReloadAppFeatureData', () => {
    before(() => {
      wrapper.instance().appContentCustomEventHandlerReloadAppFeatureData(fakeLoadContent, fakeLoadTimeline)
    })

    after(() => {
      fakeLoadContent.resetHistory()
      fakeLoadTimeline.resetHistory()
    })

    it('should call the 2 functions given in parameter', () => {
      expect(fakeLoadContent.called).to.equal(true)
      expect(fakeLoadTimeline.called).to.equal(true)
    })
  })

  describe('function appContentCustomEventHandlerAllAppChangeLanguage', () => {
    const fakeTinymceRemove = sinon.spy()
    const fakeI18nChangeLanguage = sinon.spy()
    const fakeI18n = {
      changeLanguage: fakeI18nChangeLanguage
    }
    const newLang = 'en'
    const dummyChangeNewCommentHandler = () => {}
    const fakeWysiwygConstructor = sinon.spy()

    before(() => {
      global.tinymce.remove = fakeTinymceRemove
      global.wysiwyg = fakeWysiwygConstructor
      wrapper.instance().appContentCustomEventHandlerAllAppChangeLanguage(newLang, fakeSetState, fakeI18n, false)
    })

    after(() => {
      fakeSetState.resetHistory()
      fakeI18nChangeLanguage.resetHistory()
    })

    it('should call setState to change the user lang', () => {
      // INFO - CH - 2019-01-07 - I don't know how to do a callWith when setState is called with a function in parameter
      sinon.assert.called(fakeSetState)
    })

    it('should call the function changeLanguage of i18n object', () => {
      sinon.assert.calledWith(fakeI18nChangeLanguage, newLang)
    })

    describe('with isTimelineWysiwyg to true', () => {
      const fakeWysiwygConstructor = sinon.spy()
      before(() => {
        global.tinymce.remove = fakeTinymceRemove
        global.wysiwyg = fakeWysiwygConstructor
        wrapper.instance().appContentCustomEventHandlerAllAppChangeLanguage(newLang, fakeSetState, fakeI18n, true, dummyChangeNewCommentHandler)
      })

      after(() => {
        fakeTinymceRemove.resetHistory()
        fakeWysiwygConstructor.resetHistory()
        fakeSetState.resetHistory()
        fakeI18nChangeLanguage.resetHistory()
      })

      it('should remove the tinymce comment field', () => {
        sinon.assert.calledWith(fakeTinymceRemove, '#wysiwygTimelineComment')
      })

      it('should call the tinymce constructor', () => {
        sinon.assert.calledWith(fakeWysiwygConstructor, '#wysiwygTimelineComment', newLang, dummyChangeNewCommentHandler)
      })
    })
  })

  describe('function appContentChangeTitle', () => {
    describe('on title change success', async () => {
      let response = {}

      before(async () => {
        wrapper.instance().checkApiUrl = fakeCheckApiUrl

        const newLabel = 'Edited label'
        mockPutContent200(fakeApiUrl, fakeContent.workspace_id, fakeContent.content_id, appContentSlug, newLabel, fakeContent.raw_content)
        response = await wrapper.instance().appContentChangeTitle(fakeContent, newLabel, appContentSlug)
      })

      after(() => {
        fakeCheckApiUrl.resetHistory()
        global.GLOBAL_dispatchEvent.resetHistory()
      })

      it('should call the function checkApiUrl', () => {
        expect(fakeCheckApiUrl.called).to.equal(true)
      })

      it('should return the response from api with handleFetchResponse called on it', () => {
        expect(response)
          .to.have.property('apiResponse')
          .and.have.property('body')
      })
    })
  })

  describe('function appContentChangeComment', () => {
    const newComment = 'edited comment text'

    before(() => {
      const fakeEvent = { target: { value: newComment } }
      wrapper.instance().appContentChangeComment(fakeEvent, fakeContent, fakeSetState, appContentSlug)
    })

    after(() => {
      fakeSetState.resetHistory()
      global.localStorage.setItem.resetHistory()
    })

    it('should call setState with the new comment value', () => {
      sinon.assert.calledWith(fakeSetState, { newComment: newComment })
    })

    it('should set the localStorage value', () => {
      sinon.assert.calledWith(
        global.localStorage.setItem,
        generateLocalStorageContentId(fakeContent.workspace_id, fakeContent.content_id, appContentSlug, 'comment')
      )
    })
  })

  describe('function saveCommentAsText', () => {
    describe('on comment save success', async () => {
      let response
      const newComment = 'Edited comment'
      const fakeTinymceSetContent = sinon.spy()
      const activeEditor = {
        dom: {
          select: () => []
        },
        getContent: () => newComment,
        setContent: fakeTinymceSetContent
      }

      global.tinymce = {
        ...global.tinymce,
        get: (id) => activeEditor
      }

      before(async () => {
        wrapper.instance().checkApiUrl = fakeCheckApiUrl
        const loggedUser = {
          username: 'foo',
          lang: 'en'
        }
        const isCommentWysiwyg = true
        mockPostContentComment200(fakeApiUrl, fakeContent.workspace_id, fakeContent.content_id, newComment, fakeContent.content_namespace)
        response = await wrapper.instance().saveCommentAsText(
          fakeContent, isCommentWysiwyg, newComment, fakeSetState, appContentSlug, loggedUser, 'foo'
        )
      })

      after(() => {
        fakeCheckApiUrl.resetHistory()
        fakeTinymceSetContent.resetHistory()
        global.localStorage.removeItem.resetHistory()
        global.GLOBAL_dispatchEvent.resetHistory()
      })

      it('should reset the tinymce comment field since we set param isCommentWysiwyg to true', () => {
        sinon.assert.calledWith(fakeTinymceSetContent, '')
      })

      it('should remove the localStorage value', () => {
        sinon.assert.calledWith(
          global.localStorage.removeItem,
          generateLocalStorageContentId(fakeContent.workspace_id, fakeContent.content_id, appContentSlug, 'comment')
        )
      })

      it('should return the response from api with handleFetchResponse called on it', () => {
        expect(response)
          .to.have.property('apiResponse')
          .and.have.property('body')
      })
    })
  })

  describe('function appContentSaveNewComment', () => {
    const newComment = 'Edited comment'

    before(() => {
      wrapper.instance().checkApiUrl = fakeCheckApiUrl
      const loggedUser = {
        username: 'foo',
        lang: 'en'
      }
      const fileChildContentList = []
      const isCommentWysiwyg = true
      wrapper.instance().appContentSaveNewComment(
        fakeContent, isCommentWysiwyg, newComment, fileChildContentList, fakeSetState, appContentSlug, loggedUser, 'foo'
      )
    })

    after(() => {
      fakeCheckApiUrl.resetHistory()
    })

    it('should call the function checkApiUrl', () => {
      expect(fakeCheckApiUrl.called).to.equal(true)
    })
  })

  describe('function appContentChangeStatus', () => {
    describe('on status change success', async () => {
      before(async () => {
        wrapper.instance().checkApiUrl = fakeCheckApiUrl

        const newStatusSlug = status.VALIDATED.slug
        mockPutContentStatus204(fakeApiUrl, fakeContent.workspace_id, fakeContent.content_id, appContentSlug, newStatusSlug)
        await wrapper.instance().appContentChangeStatus(fakeContent, newStatusSlug, appContentSlug)
      })

      after(() => {
        fakeCheckApiUrl.resetHistory()
        global.GLOBAL_dispatchEvent.resetHistory()
      })

      it('should call the function checkApiUrl', () => {
        expect(fakeCheckApiUrl.called).to.equal(true)
      })
    })
  })

  describe('function appContentArchive', () => {
    describe('on archive success', async () => {
      before(async () => {
        wrapper.instance().checkApiUrl = fakeCheckApiUrl

        mockPutContentArchive204(fakeApiUrl, fakeContent.workspace_id, fakeContent.content_id)
        await wrapper.instance().appContentArchive(fakeContent, fakeSetState, appContentSlug)
      })

      after(() => {
        fakeCheckApiUrl.resetHistory()
        fakeSetState.resetHistory()
        global.GLOBAL_dispatchEvent.resetHistory()
      })

      it('should call the function checkApiUrl', () => {
        expect(fakeCheckApiUrl.called).to.equal(true)
      })

      it('should call setState to set the content as archived', () => {
        // INFO - CH - 2019-01-07 - I don't know how to do a callWith when setState is called with a function in parameter
        sinon.assert.called(fakeSetState)
      })
    })
  })

  describe('function appContentDelete', () => {
    describe('on delete success', async () => {
      before(async () => {
        wrapper.instance().checkApiUrl = fakeCheckApiUrl

        mockPutContentDelete204(fakeApiUrl, fakeContent.workspace_id, fakeContent.content_id)
        await wrapper.instance().appContentDelete(fakeContent, fakeSetState, appContentSlug)
      })

      after(() => {
        fakeCheckApiUrl.resetHistory()
        fakeSetState.resetHistory()
        global.GLOBAL_dispatchEvent.resetHistory()
      })

      it('should call the function checkApiUrl', () => {
        expect(fakeCheckApiUrl.called).to.equal(true)
      })

      it('should call setState to set the content as deleted', () => {
        // INFO - CH - 2019-01-07 - I don't know how to do a callWith when setState is called with a function in parameter
        sinon.assert.called(fakeSetState)
      })
    })
  })

  describe('function appContentRestoreArchive', () => {
    describe('on archive restore success', async () => {
      before(async () => {
        wrapper.instance().checkApiUrl = fakeCheckApiUrl

        mockPutContentArchiveRestore204(fakeApiUrl, fakeContent.workspace_id, fakeContent.content_id)
        await wrapper.instance().appContentRestoreArchive(fakeContent, fakeSetState, appContentSlug)
      })

      after(() => {
        fakeCheckApiUrl.resetHistory()
        fakeSetState.resetHistory()
        global.GLOBAL_dispatchEvent.resetHistory()
      })

      it('should call the function checkApiUrl', () => {
        expect(fakeCheckApiUrl.called).to.equal(true)
      })

      it('should call setState to set the content as not archived', () => {
        // INFO - CH - 2019-01-07 - I don't know how to do a callWith when setState is called with a function in parameter
        sinon.assert.called(fakeSetState)
      })
    })
  })

  describe('function appContentRestoreDelete', () => {
    describe('on archive restore success', async () => {
      before(async () => {
        wrapper.instance().checkApiUrl = fakeCheckApiUrl

        mockPutContentDeleteRestore204(fakeApiUrl, fakeContent.workspace_id, fakeContent.content_id)
        await wrapper.instance().appContentRestoreDelete(fakeContent, fakeSetState, appContentSlug)
      })

      after(() => {
        fakeCheckApiUrl.resetHistory()
        fakeSetState.resetHistory()
        global.GLOBAL_dispatchEvent.resetHistory()
      })

      it('should call the function checkApiUrl', () => {
        expect(fakeCheckApiUrl.called).to.equal(true)
      })
    })
  })

  describe('function buildTimelineFromCommentAndRevision', () => {
    const loggedUser = {
      username: 'foo',
      lang: 'en'
    }
    const commentList = fixtureCommentList
    const fileChildContentList = []
    const revisionList = fixtureRevisionList.map((revision, i) => ({
      ...revision,
      // INFO - CH - 2019-01-14 - ensure that the first revision after creation has all the comments from commentList
      comment_ids: i === 1 ? commentList.map(comment => comment.content_id) : []
    }))
    let commentAndRevisionMergedList = []

    before(() => {
      commentAndRevisionMergedList = wrapper.instance().buildTimelineFromCommentAndRevision(
        commentList, revisionList, fileChildContentList, loggedUser
      )
    })

    it('should have merged all the comments and revision at depth 0', () => {
      expect(commentAndRevisionMergedList.length).to.equal(commentList.length + revisionList.length)
    })
  })

  describe('TLM handlers', () => {
    describe('handleContentCommentCreated', () => {
      it('should update the timeline if the tlm is related to the current content', () => {
        const tlmData = {
          fields: {
            content: {
              ...commentTlm,
              parent_id: fakeContent.content_id,
              content_id: 9
            }
          }
        }
        wrapper.instance().handleChildContentCreated(tlmData)
        expect(wrapper.state().timeline.find(item => item.content_id === tlmData.fields.content.content_id)).to.exist
      })

      it('should not update the timeline if the tlm is not related to the current content', () => {
        const tlmData = {
          fields: {
            content: {
              ...commentTlm,
              parent_id: fakeContent.content_id + 1,
              content_id: 12
            }
          }
        }
        wrapper.instance().handleChildContentCreated(tlmData)
        expect(wrapper.state().timeline.find(item => item.content_id === tlmData.fields.content.content_id)).to.not.exist
      })
    })

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
