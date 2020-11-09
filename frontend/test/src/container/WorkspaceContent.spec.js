import React from 'react'
import { uniqBy } from 'lodash'
import { shallow } from 'enzyme'
import { expect } from 'chai'
import sinon from 'sinon'
import { WorkspaceContent } from '../../../src/container/WorkspaceContent.jsx'
import { firstWorkspace } from '../../fixture/workspace/firstWorkspace.js'
import { user } from '../../hocMock/redux/user/user.js'
import { contentType } from '../../hocMock/redux/contentType/contentType.js'
import { appList } from '../../hocMock/redux/appList/appList.js'
import { isFunction } from '../../hocMock/helper'
import {
  ADD,
  FLASH_MESSAGE,
  FOLDER
} from '../../../src/action-creator.sync'
import { FETCH_CONFIG } from '../../../src/util/helper'
import {
  mockPutContentItemMove200,
  mockPutContentItemMove400,
  mockGetFolderContentList200
} from '../../apiMock'
import {
  contentFolder as contentFolderFixture,
  content as contentFixture
} from '../../fixture/content/content.js'
import { CONTENT_TYPE } from 'tracim_frontend_lib'

describe('<WorkspaceContent />', () => {
  const addFlashMessageCallBack = sinon.spy()
  const getFolderPendingSpy = sinon.spy()

  const dispatchCallBack = (param) => {
    if (isFunction(param)) {
      return param(dispatchCallBack)
    }

    switch (param.type) {
      case `${ADD}/${FLASH_MESSAGE}`: addFlashMessageCallBack(); break
      case `GET/${FOLDER}/PENDING`: getFolderPendingSpy(); break
      default:
        return param
    }
  }

  const props = {
    dispatch: dispatchCallBack,
    match: {
      params: {
        idws: 1,
        idcts: 1
      }
    },
    registerLiveMessageHandlerList: () => {},
    registerCustomEventHandlerList: () => {},
    t: tradKey => tradKey,
    workspaceContentList: {
      workspaceId: 24,
      contentList: [{
        ...contentFixture,
        id: 3,
        parentId: null,
        isOpen: false,
        type: CONTENT_TYPE.HTML_DOCUMENT
      }, {
        ...contentFixture,
        id: 2,
        parentId: null,
        isOpen: false,
        type: CONTENT_TYPE.HTML_DOCUMENT
      }]
    },
    system: {
      workspaceListLoaded: true,
      config: {
        instance_name: 'instanceTest'
      }
    },
    user: user,
    currentWorkspace: firstWorkspace,
    contentType,
    appList
  }

  const wrapper = shallow(<WorkspaceContent {...props} />)

  describe('functions', () => {
    describe('handleDropMoveContent', () => {
      const initialSource = {
        workspaceId: props.workspaceContentList.workspaceId,
        contentId: 3,
        parentId: 0
      }
      const initialDestination = {
        dropEffect: 'move',
        workspaceId: props.workspaceContentList.workspaceId,
        contentId: 2,
        parentId: 0
      }

      describe('move a content in a folder of the same workspace', () => {
        before(() => {
          addFlashMessageCallBack.resetHistory()
        })

        it('should not display error message', (done) => {
          mockPutContentItemMove200(FETCH_CONFIG.apiUrl, initialSource)
          wrapper.instance().handleDropMoveContent(initialSource, initialDestination).then(() => {
            expect(addFlashMessageCallBack.called).to.equal(false)
          }).then(done, done)
        })
      })

      describe('move a content which trigger a backend error', () => {
        before(() => {
          addFlashMessageCallBack.resetHistory()
        })

        it('should display a error message', (done) => {
          mockPutContentItemMove400(FETCH_CONFIG.apiUrl, initialSource)
          wrapper.instance().handleDropMoveContent(initialSource, initialDestination).then(() => {
            expect(addFlashMessageCallBack.called).to.equal(true)
          }).then(done, done)
        })
      })
    })
  })

  describe('opening a folder that already has contents in it', () => {
    beforeEach(() => {
      const contentAlreadyInFolder = {
        id: 13,
        parentId: contentFolderFixture.id,
        type: CONTENT_TYPE.FILE
      }

      wrapper.setProps({
        workspaceContentList: {
          workspaceId: props.workspaceContentList.workspaceId,
          contentList: [
            ...props.workspaceContentList.contentList,
            { ...contentFolderFixture, isOpen: false }, // INFO - CH - 2020-07-01 - add a folder
            contentAlreadyInFolder // INFO - CH - 2020-07-01 - add a content in that folder
          ]
        }
      })

      const folderContentReturnedByApi = [
        { content_id: contentAlreadyInFolder.id, parent_id: contentFolderFixture.id },
        { content_id: 20, parent_id: null }
      ]

      mockGetFolderContentList200(FETCH_CONFIG.apiUrl, props.workspaceContentList.workspaceId, folderContentReturnedByApi)

      wrapper.instance().handleToggleFolderOpen(contentFolderFixture.id)
    })

    it('should reload its content', () => {
      expect(getFolderPendingSpy.called).to.equal(true)
    })

    it('should not duplicate the contents already present', () => {
      const contentList = wrapper.instance().props.workspaceContentList.contentList
      const uniqueContentList = uniqBy(contentList, 'id')
      expect(contentList.length).to.equal(uniqueContentList.length)
    })
  })
})
