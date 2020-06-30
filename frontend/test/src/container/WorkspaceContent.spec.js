import React from 'react'
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
  FLASH_MESSAGE
} from '../../../src/action-creator.sync'
import { FETCH_CONFIG } from '../../../src/util/helper'
import { mockPutContentItemMove200, mockPutContentItemMove400 } from '../../apiMock'

describe('<WorkspaceContent />', () => {
  const addFlashMessageCallBack = sinon.spy()

  const dispatchCallBack = (param) => {
    if (isFunction(param)) {
      return param(dispatchCallBack)
    }
    switch (param.type) {
      case `${ADD}/${FLASH_MESSAGE}`:
        addFlashMessageCallBack()
        break
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
    location: {},
    registerLiveMessageHandlerList: () => {},
    registerCustomEventHandlerList: () => {},
    t: tradKey => tradKey,
    workspaceContentList: {
      workspaceId: 24,
      contentList: [{
        id: 3
      }, {
        id: 2
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
})
