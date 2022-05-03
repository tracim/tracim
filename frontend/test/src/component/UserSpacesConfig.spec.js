import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import {
  onlyManager,
  UserSpacesConfig as UserSpacesConfigWithoutHOC
} from '../../../src/component/Account/UserSpacesConfig.jsx'
import { ROLE } from 'tracim_frontend_lib'
import { userFromApi } from '../../hocMock/redux/user/user.js'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace.js'
import { FETCH_CONFIG } from '../../../src/util/helper.js'
import { mockGetUserWorkspaceList200 } from '../../apiMock.js'
import { isFunction } from '../../hocMock/helper'

describe('<UserSpacesConfig />', () => {
  const dispatchMock = params => {
    if (isFunction(params)) return params(dispatchMock)
    return params
  }

  const onChangeSubscriptionNotifCallBack = sinon.spy()

  const props = {
    registerLiveMessageHandlerList: () => {},
    userToEditId: 0,
    onChangeSubscriptionNotif: onChangeSubscriptionNotifCallBack,
    system: { config: {} },
    admin: true,
    dispatch: dispatchMock,
    t: key => key
  }

  const wrapper = shallow(<UserSpacesConfigWithoutHOC {...props} />)

  const memberManager1 = {
    user_id: 0,
    role: ROLE.workspaceManager.slug,
    doNotify: true,
    publicName: 'publicname_01',
    username: 'username_01'
  }
  const memberNotManager = {
    user_id: 1,
    role: ROLE.contributor.slug,
    doNotify: true,
    publicName: 'publicname_02',
    username: 'username_02'
  }
  const memberManager2 = {
    user_id: 2,
    role: ROLE.workspaceManager.slug,
    doNotify: true,
    publicName: 'publicname_03',
    username: 'username_03'
  }

  const memberListOneManager = [memberManager1, memberNotManager]
  const memberListTwoManagers = [memberManager1, memberNotManager, memberManager2]

  const workspaceList = [
    {
      workspace_id: 1,
      label: 'randomLabel1',
      memberList: memberListOneManager
    },
    {
      memberList: memberListTwoManagers,
      workspace_id: 2,
      label: 'randomLabel2'
    }
  ]
  mockGetUserWorkspaceList200(FETCH_CONFIG.apiUrl, false, workspaceList)

  describe('onlyManager', () => {
    it('should return false if the member is not manager', () => {
      const result = onlyManager({ userToEditId: 1 }, memberNotManager, [])
      expect(result).to.equal(false)
    })

    it('should return true if the member is the only manager', () => {
      const result = onlyManager(props, memberManager1, memberListOneManager)
      console.log(memberManager1)
      expect(result).to.equal(true)
    })

    it('should return false if the member is not the only manager', () => {
      const result = onlyManager(props, memberManager1, memberListTwoManagers)
      expect(result).to.equal(false)
    })
  })

  describe('eventType space member', () => {
    describe('handleMemberModified', () => {
      it.skip("should update member's notifications", () => {
        wrapper.setState({ workspaceList })
        const tlmData = {
          fields: {
            author: userFromApi,
            user: { ...userFromApi, user_id: 0 },
            member: { role: 'workspace-manager', do_notify: false },
            workspace: { ...firstWorkspaceFromApi, workspace_id: 2 }
          }
        }
        wrapper.instance().handleMemberModified(tlmData)

        const member = wrapper.state().workspaceList.find(
          space => space.workspace_id === tlmData.fields.workspace.workspace_id
        ).memberList.find(m => m.user_id === tlmData.fields.user.user_id)

        expect(member.do_notify).to.equal(tlmData.fields.member.do_notify)
      })
    })
  })
})
