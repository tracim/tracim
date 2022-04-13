import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'

import { SPACE_TYPE, SUBSCRIPTION_TYPE, TextInput } from 'tracim_frontend_lib'
import { JoinWorkspace as JoinWorkspaceWithoutHOC } from '../../../src/container/JoinWorkspace.jsx'
import { user } from '../../hocMock/redux/user/user.js'

const wrapJoinWorkspaceComponent = (props) => {
  const wrapper = shallow(<JoinWorkspaceWithoutHOC {...props} />)
  wrapper.instance().loadSubscriptionList = () => {}
  return wrapper
}

describe('<JoinWorkspace />', () => {
  const props = {
    user: user,
    history: {
      location: {
        state: {
          fromSearch: false
        }
      },
      push: () => {}
    },
    t: key => key,
    registerCustomEventHandlerList: () => { },
    registerLiveMessageHandlerList: () => { },
    accessibleWorkspaceList: [],
    workspaceSubscriptionList: [],
    dispatch: async (cb) => await cb
  }

  const createRequestComponentTestCases = [
    {
      workspace: { accessType: SPACE_TYPE.open.slug },
      expectedIcon: 'fas fa-sign-in-alt',
      expectedText: 'Join the space'
    },
    {
      workspace: { accessType: SPACE_TYPE.onRequest.slug },
      expectedIcon: 'fas fa-share',
      expectedText: 'Request access'
    }
  ]

  createRequestComponentTestCases.forEach(testCase => {
    describe(`its createRequestComponent() function with a ${testCase.workspace.accessType} access type`, () => {
      const wrapper = wrapJoinWorkspaceComponent(props)
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
    }
  ]

  createRequestComponentTestCasesWithSubscription.forEach(testCase => {
    const workspace = { id: 1, accessType: SPACE_TYPE.onRequest.slug }
    const workspaceSubscriptionList = [{ workspace: { workspace_id: 1 }, state: testCase.subscriptionState }]
    describe(`its createRequestComponent() function with a subscription state '${testCase.subscriptionState}'`, () => {
      const wrapper = wrapJoinWorkspaceComponent({ ...props, workspaceSubscriptionList: workspaceSubscriptionList })
      const joinWorkspaceInstance = wrapper.instance()
      const component = joinWorkspaceInstance.createRequestComponent(workspace)
      it(`should return an icon '${testCase.expectedIcon}' with text '${testCase.expectedText}'`, () => {
        expect(component.props.children[0].props.className).to.include(testCase.expectedIcon)
        expect(component.props.children[2]).to.equal(testCase.expectedText)
      })
    })
  })

  describe('its workspace filter input', () => {
    const accessibleWorkspaceList = [
      { id: 1, label: 'Foo', description: 'bar', accessType: 'open' },
      { id: 2, label: 'Hello', description: 'World', accessType: 'open' }
    ]
    const wrapper = wrapJoinWorkspaceComponent({ ...props, accessibleWorkspaceList: accessibleWorkspaceList })
    const testCases = [
      { spaceCount: 1, filter: 'Foo' },
      { spaceCount: 1, filter: 'foo' },
      { spaceCount: 0, filter: 'Buzz' },
      { spaceCount: 1, filter: 'world' }
    ]
    testCases.forEach(testCase => {
      it(`should keep ${testCase.spaceCount} space(s) for "${testCase.filter}"`, () => {
        wrapper.find(TextInput).simulate('change', { target: { value: testCase.filter } })
        // NOTE S.G. - 2020-10826 : need +1 as there is always the header
        expect(wrapper.find('.joinWorkspace__content__workspaceList__item').length).to.equal(testCase.spaceCount + 1)
      })
    })
  })
})
