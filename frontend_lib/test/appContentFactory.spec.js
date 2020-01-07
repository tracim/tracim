import React from 'react'
import { expect } from 'chai'
import sinon from 'sinon'
import { shallow } from 'enzyme'
import { appContentFactory } from '../src/appContentFactory.js'
import { status } from './fixture/status.js'
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
import {
  APP_FEATURE_MODE,
  generateLocalStorageContentId
} from '../src/helper.js'


describe('appContentFactory.js', () => {
  const fakeCheckApiUrl = sinon.stub() // TODO: Do I need a stub here ?
  global.GLOBAL_dispatchEvent = sinon.spy()
  global.localStorage = {
    setItem: sinon.spy(),
    removeItem: sinon.spy()
  }
  const fakeSetState = sinon.spy()

  const DummyComponent = () => <div>I'm empty</div>
  const WrappedDummyComponent = appContentFactory(DummyComponent)
  const wrapper = shallow(<WrappedDummyComponent />)

  const fakeContent = {
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

  describe('function appContentChangeTitle', () => {
    describe('on title change success', async () => {
      let response = {}

      before(async () => {
        wrapper.instance().checkApiUrl = fakeCheckApiUrl

        const newLabel = 'Edited label'
        mockPutContent200(fakeApiUrl, fakeContent.workspace_id, fakeContent.content_id, appContentSlug, newLabel, fakeContent.raw_content)
        response = await wrapper.instance().appContentChangeTitle(fakeContent, newLabel, appContentSlug)
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
        fakeSetState.resetHistory()
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
      let response = {}

      before(async () => {
        wrapper.instance().checkApiUrl = fakeCheckApiUrl

        const newStatusSlug = status.VALIDATED.slug
        mockPutContentStatus204(fakeApiUrl, fakeContent.workspace_id, fakeContent.content_id, appContentSlug, newStatusSlug)
        response = await wrapper.instance().appContentChangeStatus(fakeContent, newStatusSlug, appContentSlug)
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
      let response = {}

      before(async () => {
        wrapper.instance().checkApiUrl = fakeCheckApiUrl

        mockPutContentArchive204(fakeApiUrl, fakeContent.workspace_id, fakeContent.content_id)
        response = await wrapper.instance().appContentArchive(fakeContent, fakeSetState, appContentSlug)
      })

      after(() => {
        fakeSetState.resetHistory()
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
      let response = {}

      before(async () => {
        wrapper.instance().checkApiUrl = fakeCheckApiUrl

        mockPutContentDelete204(fakeApiUrl, fakeContent.workspace_id, fakeContent.content_id)
        response = await wrapper.instance().appContentDelete(fakeContent, fakeSetState, appContentSlug)
      })

      after(() => {
        fakeSetState.resetHistory()
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
      let response = {}

      before(async () => {
        wrapper.instance().checkApiUrl = fakeCheckApiUrl

        mockPutContentArchiveRestore204(fakeApiUrl, fakeContent.workspace_id, fakeContent.content_id)
        response = await wrapper.instance().appContentRestoreArchive(fakeContent, fakeSetState, appContentSlug)
      })

      after(() => {
        fakeSetState.resetHistory()
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
      let response = {}

      before(async () => {
        wrapper.instance().checkApiUrl = fakeCheckApiUrl

        mockPutContentDeleteRestore204(fakeApiUrl, fakeContent.workspace_id, fakeContent.content_id)
        response = await wrapper.instance().appContentRestoreDelete(fakeContent, fakeSetState, appContentSlug)
      })

      after(() => {
        fakeSetState.resetHistory()
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
    // TODO
  })
})
