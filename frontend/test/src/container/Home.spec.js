import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'
import configureMockStore from 'redux-mock-store'
import { withRouterMock } from '../../hocMock/withRouter'
import { translateMock } from '../../hocMock/translate.js'
import { Home as HomeWithoutHOC } from '../../../src/container/Home.jsx'
import sinon from 'sinon'
import { user, userFromApi } from '../../hocMock/redux/user/user.js'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace.js'
import { workspaceList } from '../../hocMock/redux/workspaceList/workspaceList'
import { isFunction } from '../../hocMock/helper'
import {
  REMOVE,
  SET,
  UPDATE,
  USER_USERNAME,
  WORKSPACE_LIST
} from '../../../src/action-creator.sync.js'

describe('<Home />', () => {
  const renderAppPopupCreationCallBack = sinon.spy()
  const updateUserUsernameCallBack = sinon.spy()
  const setWorkspaceListCallBack = sinon.spy()
  const removeFromWorkspaceListCallBack = sinon.spy()

  const dispatchMock = (params) => {
    if (isFunction(params)) return params(dispatchMock)

    const { type } = params
    switch (type) {
      case `${UPDATE}/${USER_USERNAME}`: updateUserUsernameCallBack(); break
      case `${SET}/${WORKSPACE_LIST}`: setWorkspaceListCallBack(); break
      case `${REMOVE}/${WORKSPACE_LIST}`: removeFromWorkspaceListCallBack(); break
    }
    return params
  }

  const mockStore = configureMockStore()
  const store = mockStore({})

  const props = {
    user: user,
    workspaceList: [],
    system: {
      workspaceListLoaded: true,
      config: {
        instance_name: 'instanceTest'
      }
    },
    t: key => key,
    canCreateWorkspace: true,
    renderAppPopupCreation: renderAppPopupCreationCallBack,
    dispatch: dispatchMock,
    registerCustomEventHandlerList: () => { },
    registerLiveMessageHandlerList: () => { }
  }

  const HomeWithHOC1 = withRouterMock(translateMock()(HomeWithoutHOC))
  const HomeWithHOC2 = ({ system, workspaceList }) => <Provider store={store}><HomeWithHOC1 {...props} system={system} workspaceList={workspaceList} /></Provider>

  const wrapper = mount(<HomeWithHOC2 {...props} system={props.system} workspaceList={props.workspaceList} />)
  const homeWrapper = wrapper.find(HomeWithoutHOC)
  const homeInstance = homeWrapper.instance()

  describe('TLM handlers', () => {
    describe('eventType user', () => {
      const tlmData = {
        author: userFromApi,
        user: userFromApi
      }
      describe('handleUserModified', () => {
        homeInstance.handleUserModified(tlmData)
        it('should call this.props.dispatch(updateUserUsername())', () => {
          expect(updateUserUsernameCallBack.called).to.equal(true)
        })
      })
    })

    describe('eventType sharespace member', () => {
      const tlmData = {
        author: userFromApi,
        user: userFromApi,
        workspace: firstWorkspaceFromApi
      }
      describe('handleWorkspaceMemberCreated', () => {
        homeInstance.handleWorkspaceMemberCreated(tlmData)
        it('should call this.props.dispatch(setWorkspaceList())', () => {
          expect(setWorkspaceListCallBack.called).to.equal(true)
        })
      })
      describe('handleWorkspaceMemberDeleted', () => {
        wrapper.setProps({ workspaceList: workspaceList.workspaceList })
        homeInstance.handleWorkspaceMemberDeleted(tlmData)
        it('should call this.props.dispatch(removeFromWorkspaceList())', () => {
          expect(removeFromWorkspaceListCallBack.called).to.equal(true)
        })
      })
    })
  })

  describe('static design', () => {
    it('should render the root div', () =>
      expect(homeWrapper.find('div.tracim__content').length).equal(1)
    )

    it('should not render if workspaceList is not loaded', () => {
      wrapper.setProps({ system: { ...props.system, workspaceListLoaded: false } })
      expect(wrapper.find('div.tracim__content').length).equal(0)
      wrapper.setProps({ system: props.system })
    })
  })

  describe('handler', () => {
    it('renderAppPopupCreationCallBack should be called when handleClickCreateWorkspace is called', () => {
      homeInstance.handleClickCreateWorkspace({ preventDefault: () => {} })
      expect(renderAppPopupCreationCallBack.called).to.equal(true)
    })
  })
})
