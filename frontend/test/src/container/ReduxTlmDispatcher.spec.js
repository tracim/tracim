import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import { addWorkspaceSubscription, updateWorkspaceSubscription, removeWorkspaceSubscription } from '../../../src/action-creator.sync.js'
import { ReduxTlmDispatcher as ReduxTlmDispatcherWithoutHOC } from '../../../src/container/ReduxTlmDispatcher.jsx'
import { user } from '../../hocMock/redux/user/user'

const createSubscription = (userId) => {
  return {
    state: 'pending',
    workspace: {
      workspace_id: 1
    },
    author: {
      user_id: userId
    }
  }
}

describe('<ReduxTlmDispatcher />', () => {
  const props = {
    user: user,
    t: k => k,
    registerLiveMessageHandlerList: () => {},
    dispatch: sinon.spy()
  }

  const wrapper = shallow(
    <ReduxTlmDispatcherWithoutHOC {...props} />
  )
  describe('workspace subscription TLM handlers', () => {

    const testCases = [
      {
        handler: wrapper.instance().handleWorkspaceSubscriptionCreated,
        name: 'handleWorkspaceSubscriptionCreated',
        description: 'call the addWorkspaceSubscription action',
        eventType: 'workspace_subscription.created',
        subscription: createSubscription(1),
        action: addWorkspaceSubscription,
        expectedCalled: true
      },
      {
        handler: wrapper.instance().handleWorkspaceSubscriptionCreated,
        name: 'handleWorkspaceSubscriptionCreated',
        description: 'not call the addWorkspaceSubscription action',
        eventType: 'workspace_subscription.created',
        subscription: createSubscription(2),
        action: addWorkspaceSubscription,
        expectedCalled: false
      },
      {
        handler: wrapper.instance().handleWorkspaceSubscriptionDeleted,
        name: 'handleWorkspaceSubscriptionDeleted',
        description: 'call the removeWorkspaceSubscription action',
        eventType: 'workspace_subscription.deleted',
        subscription: createSubscription(1),
        action: removeWorkspaceSubscription,
        expectedCalled: true
      },
      {
        handler: wrapper.instance().handleWorkspaceSubscriptionDeleted,
        name: 'handleWorkspaceSubscriptionDeleted',
        description: 'not call the removeWorkspaceSubscription action',
        eventType: 'workspace_subscription.deleted',
        subscription: createSubscription(2),
        action: removeWorkspaceSubscription,
        expectedCalled: false
      },
      {
        handler: wrapper.instance().handleWorkspaceSubscriptionModified,
        name: 'handleWorkspaceSubscriptionModified',
        description: 'call the updateWorkspaceSubscription reducer',
        eventType: 'workspace_subscription.modified',
        subscription: { ...createSubscription(1), createdDate: 'foo' },
        action: updateWorkspaceSubscription,
        expectedCalled: true
      },
      {
        handler: wrapper.instance().handleWorkspaceSubscriptionModified,
        name: 'handleWorkspaceSubscriptionModified',
        description: 'not call the updateWorkspaceSubscription reducer',
        eventType: 'workspace_subscription.modified',
        subscription: { ...createSubscription(2), createdDate: 'foo' },
        action: updateWorkspaceSubscription,
        expectedCalled: false
      }
    ]
    for (const testCase of testCases) {
      describe(`"${testCase.eventType}" from user ${testCase.subscription.author.user_id}`, () => {
        beforeEach(() => props.dispatch.resetHistory())

        const tlm = {
          event_type: testCase.eventType,
          fields: {
            user: {
              user_id: testCase.subscription.author.user_id
            },
            author: {
              user_id: testCase.subscription.author.user_id
            },
            subscription: testCase.subscription
          }
        }

        it(`should ${testCase.description}`, () => {
          testCase.handler(tlm)
          expect(!testCase.expectedCalled || props.dispatch.calledOnceWith(testCase.action(testCase.subscription))).to.equal(true)
        })
      })
    }
  })
})
