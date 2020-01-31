import React from 'react'
import { expect } from 'chai'
import sinon from 'sinon'
import { shallow } from 'enzyme'
import { appContentFactory } from '../src/appContentFactory.js'
import { status } from './fixture/status.js'
import { commentList as fixtureCommentList } from './fixture/contentCommentList.js'
import { revisionList as fixtureRevisionList } from './fixture/contentRevisionList.js'
import { content } from './fixture/content.js'
import {
  mockPutContent200,
  mockPostContentComment200,
  mockPutContentStatus204,
  mockPutContentArchive204,
  mockPutContentDelete204,
  mockPutContentArchiveRestore204,
  mockPutContentDeleteRestore204
} from './apiMock.js'
import { CUSTOM_EVENT } from '../src/customEvent.js'
import { generateLocalStorageContentId } from '../src/helper.js'

describe('appContentFactory.js', () => {
  const fakeCheckApiUrl = sinon.spy()
  global.GLOBAL_dispatchEvent = sinon.spy()
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
  const wrapper = shallow(<WrappedDummyComponent />)

  const fakeContent = {
    ...content,
    workspace_id: 12,
    content_id: 42,
    label: 'unedited label',
    raw_content: 'unedited content',
    status: status.OPEN
  }
  const appContentSlug = 'appContentSlugExample'

  const fakeApiUrl = 'http://fake.url/api/v2'

  describe('The wrapped component', () => {
    it('should have all the new props', () => {
      expect(wrapper.props()).to.have.all.keys(
        'setApiUrl',
        'appContentCustomEventHandlerShowApp',
        'appContentCustomEventHandlerHideApp',
        'appContentCustomEventHandlerReloadContent',
        'appContentCustomEventHandlerReloadAppFeatureData',
        'appContentCustomEventHandlerAllAppChangeLanguage',
        'appContentChangeTitle',
        'appContentChangeComment',
        'appContentSaveNewComment',
        'appContentChangeStatus',
        'appContentArchive',
        'appContentDelete',
        'appContentRestoreArchive',
        'appContentRestoreDelete',
        'buildTimelineFromCommentAndRevision'
      )
    })
  })

  describe('function setApiUrl', () => {
    it(`should set the class property apiUrl`, () => {
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

      it('should call the custom event RELOAD_CONTENT', () => {
        sinon.assert.calledWith(
          global.GLOBAL_dispatchEvent,
          { type: CUSTOM_EVENT.RELOAD_CONTENT(newContent.content_type), data: newContent }
        )
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
    const newContent = { ...fakeContent }
    const fakeTinymceRemove = sinon.spy()

    before(() => {
      global.tinymce.remove = fakeTinymceRemove
      wrapper.instance().appContentCustomEventHandlerReloadContent(newContent, fakeSetState, appContentSlug)
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
        generateLocalStorageContentId(fakeContent.workspace_id, fakeContent.content_id, appContentSlug, 'comment')
      )
    })

    it('should call setState to update with the new comment', () => {
      // INFO - CH - 2019-01-07 - I don't know how to do a callWith when setState is called with a function in parameter
      sinon.assert.called(fakeSetState)
    })
  })

  describe('function appContentCustomEventHandlerReloadAppFeatureData', () => {
    before(() => {
      wrapper.instance().appContentCustomEventHandlerReloadAppFeatureData(fakeLoadContent, fakeLoadTimeline, fakeBuildBreadcrumbs)
    })

    after(() => {
      fakeLoadContent.resetHistory()
      fakeLoadTimeline.resetHistory()
      fakeBuildBreadcrumbs.resetHistory()
    })

    it('should call the 3 functions given in parameter', () => {
      expect(fakeLoadContent.called).to.equal(true)
      expect(fakeLoadTimeline.called).to.equal(true)
      expect(fakeBuildBreadcrumbs.called).to.equal(true)
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

      it('should call the custom event RELOAD_APP_FEATURE_DATA', () => {
        sinon.assert.calledWith(
          global.GLOBAL_dispatchEvent.firstCall,
          { type: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(appContentSlug), data: {} }
        )
      })

      it('should call the custom event REFRESH_CONTENT_LIST', () => {
        sinon.assert.calledWith(
          global.GLOBAL_dispatchEvent.secondCall,
          { type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} }
        )
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

  describe('function appContentSaveNewComment', () => {
    describe('on comment save success', async () => {
      let response = {}
      const fakeTinymceSetContent = sinon.spy()
      global.tinymce = {
        ...global.tinymce,
        get: () => ({
          setContent: fakeTinymceSetContent
        })
      }

      before(async () => {
        wrapper.instance().checkApiUrl = fakeCheckApiUrl

        const newComment = 'Edited comment'
        const isCommentWysiwyg = true
        mockPostContentComment200(fakeApiUrl, fakeContent.workspace_id, fakeContent.content_id, newComment)
        response = await wrapper.instance().appContentSaveNewComment(fakeContent, isCommentWysiwyg, newComment, fakeSetState, appContentSlug)
      })

      after(() => {
        fakeCheckApiUrl.resetHistory()
        fakeTinymceSetContent.resetHistory()
        global.localStorage.removeItem.resetHistory()
        global.GLOBAL_dispatchEvent.resetHistory()
      })

      it('should call the function checkApiUrl', () => {
        expect(fakeCheckApiUrl.called).to.equal(true)
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

      it('should call the custom event RELOAD_APP_FEATURE_DATA', () => {
        sinon.assert.calledWith(
          global.GLOBAL_dispatchEvent,
          { type: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(appContentSlug), data: {} }
        )
      })

      it('should return the response from api with handleFetchResponse called on it', () => {
        expect(response)
          .to.have.property('apiResponse')
          .and.have.property('body')
      })
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

      it('should call the custom event RELOAD_APP_FEATURE_DATA', () => {
        sinon.assert.calledWith(
          global.GLOBAL_dispatchEvent,
          { type: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(appContentSlug), data: {} }
        )
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

      it('should call the custom event RELOAD_APP_FEATURE_DATA', () => {
        sinon.assert.calledWith(
          global.GLOBAL_dispatchEvent,
          { type: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(appContentSlug), data: {} }
        )
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

      it('should call the custom event RELOAD_APP_FEATURE_DATA', () => {
        sinon.assert.calledWith(
          global.GLOBAL_dispatchEvent,
          { type: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(appContentSlug), data: {} }
        )
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

      it('should call the custom event RELOAD_APP_FEATURE_DATA', () => {
        sinon.assert.calledWith(
          global.GLOBAL_dispatchEvent,
          { type: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(appContentSlug), data: {} }
        )
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

      it('should call setState to set the content as not deleted', () => {
        // INFO - CH - 2019-01-07 - I don't know how to do a callWith when setState is called with a function in parameter
        sinon.assert.called(fakeSetState)
      })

      it('should call the custom event RELOAD_APP_FEATURE_DATA', () => {
        sinon.assert.calledWith(
          global.GLOBAL_dispatchEvent,
          { type: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(appContentSlug), data: {} }
        )
      })
    })
  })

  describe('function buildTimelineFromCommentAndRevision', () => {
    const commentList = fixtureCommentList
    const revisionList = fixtureRevisionList.map((revision, i) => ({
      ...revision,
      // INFO - CH - 2019-01-14 - ensure that the first revision after creation has all the comments from commentList
      comment_ids: i === 1 ? commentList.map(comment => comment.content_id) : []
    }))
    let commentAndRevisionMergedList = []

    before(() => {
      commentAndRevisionMergedList = wrapper.instance().buildTimelineFromCommentAndRevision(commentList, revisionList, 'en')
    })

    it('should have merged all the comments and revision at depth 0', () => {
      expect(commentAndRevisionMergedList.length).to.equal(commentList.length + revisionList.length)
    })
  })
})
