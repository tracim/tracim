import React from 'react'
import { expect } from 'chai'
import sinon from 'sinon'
import { shallow } from 'enzyme'

import { SPACE_TYPE, SUBSCRIPTION_TYPE } from 'tracim_frontend_lib'
import { JoinWorkspace as JoinWorkspaceWithoutHOC } from '../../../src/container/JoinWorkspace.jsx'
import { user } from '../../hocMock/redux/user/user.js'
import {
  SET,
  USER,
  USER_DISCONNECTED
} from '../../../src/action-creator.sync.js'

describe('<JoinWorkspace />', () => {
  const setUserDisconnectedCallBack = sinon.spy()
  const setUserLangCallBack = sinon.spy()

  const dispatchMock = (params) => {
    if (isFunction(params)) return params(dispatchMock)

    const { type } = params
    switch (type) {
      case `${SET}/${USER_DISCONNECTED}`: setUserDisconnectedCallBack(); break
      case `${SET}/${USER}/Lang`: setUserLangCallBack(); break
    }
    return params
  }

  const props = {
    user: user,
    history: {
      push: () => {}
    },
    t: key => key,
    dispatchCustomEvent: dispatchMock,
    dispatch: dispatchMock,
    registerCustomEventHandlerList: () => { },
    registerLiveMessageHandlerList: () => { },
    accessibleWorkspaceList: [],
    workspaceSubscriptionList: [],
  }

  const createRequestComponentTestCases = [
    {
      workspace: { accessType: SPACE_TYPE.open.slug },
      expectedIcon: 'sign-in',
      expectedText: 'Join the space'
    },
    {
      workspace: { accessType: SPACE_TYPE.onRequest.slug },
      expectedIcon: 'share',
      expectedText: 'Request access'
    }
  ]

  createRequestComponentTestCases.forEach(testCase => {
    describe(`its createRequestComponent() function with a ${testCase.workspace.accessType} access type`, () => {
      const wrapper = shallow(<JoinWorkspaceWithoutHOC {...props} />)
      const joinWorkspaceInstance = wrapper.instance()
      const component = joinWorkspaceInstance.createRequestComponent(testCase.workspace)
      it(`should return a button with icon '${testCase.expectedIcon}' and text '${testCase.expectedText}'`, () => {
        expect(component.props.icon).to.equal(testCase.expectedIcon)
        expect(component.props.text).to.equal(testCase.expectedText)
      })
    })
  })

  const createRequestComponentTestCasesWithSubscription = [
    {
      subscriptionState: SUBSCRIPTION_TYPE.pending.slug,
      expectedIcon: SUBSCRIPTION_TYPE.pending.faIcon,
      expectedText: 'Request sent'
    },
    {
      subscriptionState: SUBSCRIPTION_TYPE.rejected.slug,
      expectedIcon: SUBSCRIPTION_TYPE.rejected.faIcon,
      expectedText: 'Request rejected'
    }
  ]

  createRequestComponentTestCasesWithSubscription.forEach(testCase => {
    const workspace = { id: 1, accessType: SPACE_TYPE.onRequest.slug }
    const workspaceSubscriptionList = [{ workspace: { workspace_id: 1 }, state: testCase.subscriptionState }]
    describe(`its createRequestComponent() function with a subscription state '${testCase.subscriptionState}'`, () => {
      const wrapper = shallow(<JoinWorkspaceWithoutHOC {...{ ...props, workspaceSubscriptionList: workspaceSubscriptionList }} />)
      const joinWorkspaceInstance = wrapper.instance()
      const component = joinWorkspaceInstance.createRequestComponent(workspace)
      it(`should return an icon '${testCase.expectedIcon}' with text '${testCase.expectedText}'`, () => {
        expect(component.props.children[0].props.class).to.include(testCase.expectedIcon)
        expect(component.props.children[2]).to.equal(testCase.expectedText)
      })
    })
  })
})
