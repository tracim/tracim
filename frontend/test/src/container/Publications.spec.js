import React from 'react'
import sinon from 'sinon'
import { expect } from 'chai'
import { isFunction } from '../../hocMock/helper'
import { Publications } from '../../../src/container/Publications.jsx'
import { shallow } from 'enzyme'
import { user } from '../../hocMock/redux/user/user'
import { content } from '../../fixture/content/content.js'
import { firstWorkspace } from '../../fixture/workspace/firstWorkspace.js'
import { FETCH_CONFIG } from '../../../src/util/helper.js'
import {
  mockGetContentComments200,
  mockGetFileChildContent200,
  mockGetPublicationList200,
  mockPostThreadPublication204
} from '../../apiMock.js'
import {
  APPEND,
  BREADCRUMBS,
  COMMENT_LIST,
  HEAD_TITLE,
  PUBLICATION,
  REMOVE,
  SET,
  UPDATE,
  WORKSPACE_PUBLICATION_LIST
} from '../../../src/action-creator.sync.js'

describe('<Publications />', () => {
  const appendPublicationCallBack = sinon.spy()
  const updatePublicationCallBack = sinon.spy()
  const removePublicationCallBack = sinon.spy()
  const setBreadcrumbsCallBack = sinon.spy()
  const setCommentListToPublicationCallBack = sinon.spy()
  const setHeadTitleCallBack = sinon.spy()
  const setPublicationListCallBack = sinon.spy()
  const appendPublicationListCallBack = sinon.spy()

  const dispatchCallBack = (param) => {
    if (isFunction(param)) {
      return param(dispatchCallBack)
    }

    switch (param.type) {
      case `${APPEND}/${PUBLICATION}`: appendPublicationCallBack(); break
      case `${UPDATE}/${PUBLICATION}`: updatePublicationCallBack(); break
      case `${REMOVE}/${PUBLICATION}`: removePublicationCallBack(); break
      case `${SET}/${BREADCRUMBS}`: setBreadcrumbsCallBack(); break
      case `${SET}/${HEAD_TITLE}`: setHeadTitleCallBack(); break
      case `${SET}/${PUBLICATION}/${COMMENT_LIST}`: setCommentListToPublicationCallBack(); break
      case `${SET}/${WORKSPACE_PUBLICATION_LIST}`: setPublicationListCallBack(); break
      case `${APPEND}/${WORKSPACE_PUBLICATION_LIST}`: appendPublicationListCallBack(); break
      default:
        return param
    }
  }

  const props = {
    addCommentToTimeline: () => {},
    buildTimelineFromCommentAndRevision: () => [],
    buildChildContentTimelineItem: () => [],
    dispatch: dispatchCallBack,
    setApiUrl: () => {},
    registerLiveMessageHandlerList: () => {},
    registerCustomEventHandlerList: () => {},
    currentWorkspace: firstWorkspace,
    publicationPage: {
      list: [
        content,
        {
          ...content,
          id: 9,
          commentList: []
        }
      ],
      nextPageToken: '',
      hasNextPage: true
    },
    match: {
      params: {
        idws: 1
      }
    },
    t: tradKey => tradKey,
    user
  }

  const wrapper = shallow(<Publications {...props} />)
  const publicationInstance = wrapper.instance()

  const publicationTLM = {
    fields: {
      content: {
        content_id: 12,
        content_namespace: 'publication',
        parent_id: null,
        workspace_id: firstWorkspace.id
      },
      client_token: ''
    }
  }

  mockPostThreadPublication204(FETCH_CONFIG.apiUrl, props.currentWorkspace.id)

  describe('handleContentCreatedOrRestored()', () => {
    it('should call appendPublication()', () => {
      publicationInstance.handleContentCreatedOrRestored(publicationTLM)
      expect(appendPublicationCallBack.called).to.equal(true)
    })
  })

  describe('handleContentCommented()', () => {
    it('should call setCommentListToPublication()', () => {
      publicationInstance.handleContentCommented({
        ...publicationTLM,
        fields: {
          ...publicationTLM.fields,
          content: { ...publicationTLM.fields.content, parent_id: 9 }
        }
      })
      expect(setCommentListToPublicationCallBack.called).to.equal(true)
    })

    it('should call updatePublication()', () => {
      publicationInstance.handleContentCommented({
        ...publicationTLM,
        fields: {
          ...publicationTLM.fields,
          content: { ...publicationTLM.fields.content, parent_id: 9 }
        }
      })
      expect(updatePublicationCallBack.called).to.equal(true)
    })
  })

  describe('handleContentModified()', () => {
    it('should call updatePublication()', () => {
      publicationInstance.handleContentModified(publicationTLM)
      expect(updatePublicationCallBack.called).to.equal(true)
    })
  })

  describe('handleContentDeleted()', () => {
    it('should call removePublication()', () => {
      publicationInstance.handleContentDeleted(publicationTLM)
      expect(removePublicationCallBack.called).to.equal(true)
    })
  })

  describe('buildBreadcrumbs()', () => {
    it('should call setBreadcrumbs()', () => {
      publicationInstance.buildBreadcrumbs()
      expect(setBreadcrumbsCallBack.called).to.equal(true)
    })
  })

  describe('setHeadTitle()', () => {
    it('should call setHeadTitle()', () => {
      publicationInstance.setHeadTitle()
      expect(setHeadTitleCallBack.called).to.equal(true)
    })
  })

  describe('getPublicationPage()', () => {
    it('should call setPublicationList() when no token is given', (done) => {
      mockGetPublicationList200(FETCH_CONFIG.apiUrl, props.currentWorkspace.id, [])
      mockGetContentComments200(FETCH_CONFIG.apiUrl, props.currentWorkspace.id, content.id, [])
      mockGetFileChildContent200(FETCH_CONFIG.apiUrl, props.currentWorkspace.id, content.id, [])
      publicationInstance.getPublicationPage().then(() => {
        expect(setPublicationListCallBack.called).to.equal(true)
      }).then(done, done)
    })

    it('should call appendPublicationList() when a token is given', (done) => {
      mockGetPublicationList200(FETCH_CONFIG.apiUrl, props.currentWorkspace.id, [], 'pageToken')
      mockGetContentComments200(FETCH_CONFIG.apiUrl, props.currentWorkspace.id, content.id, [])
      mockGetFileChildContent200(FETCH_CONFIG.apiUrl, props.currentWorkspace.id, content.id, [])
      publicationInstance.getPublicationPage('pageToken').then(() => {
        expect(appendPublicationListCallBack.called).to.equal(true)
      }).then(done, done)
    })
  })

  describe('getCommentList()', () => {
    it('should call setCommentListToPublication()', (done) => {
      publicationInstance.getCommentList(
        content.id,
        publicationTLM.fields.content.content_namespace
      ).then(() => {
        expect(setCommentListToPublicationCallBack.called).to.equal(true)
      }).then(done, done)
    })
  })

  describe('handleChangeNewPublication()', () => {
    it('should update newComment state', () => {
      publicationInstance.handleChangeNewPublication({ target: { value: 'a' } })
      expect(wrapper.state('newComment')).to.equal('a')
    })
  })

  describe('handleCancelSave()', () => {
    it('should set showInvalidMentionPopupInComment state to false if it is false', () => {
      wrapper.setState({ showInvalidMentionPopupInComment: false })
      publicationInstance.handleCancelSave()
      expect(wrapper.state('showInvalidMentionPopupInComment')).to.equal(false)
    })

    it('should set showInvalidMentionPopupInComment state to false if it is true', () => {
      wrapper.setState({ showInvalidMentionPopupInComment: true })
      publicationInstance.handleCancelSave()
      expect(wrapper.state('showInvalidMentionPopupInComment')).to.equal(false)
    })
  })

  describe('handleClickValidateAnyway()', () => {
    global.localStorage = {
      getItem: sinon.spy(),
      setItem: sinon.spy(),
      removeItem: sinon.spy()
    }
    it('should call appendPublication()', (done) => {
      publicationInstance.handleClickValidateAnyway().then(() => {
        expect(appendPublicationCallBack.called).to.equal(true)
      }).then(done, done)
    })
  })
})
