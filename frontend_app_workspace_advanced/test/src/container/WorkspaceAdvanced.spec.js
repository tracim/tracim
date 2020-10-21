import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { author, user, workspace } from 'tracim_frontend_lib/dist/tracim_frontend_lib.test_utils.js'
import { WorkspaceAdvanced } from '../../../src/container/WorkspaceAdvanced.jsx'
import {
  mockGetAppList200,
  mockGetSubscriptionsRequests200,
  mockGetWorkspaceDetail200,
  mockGetWorkspaceMember200
} from '../../apiMock.js'
import { debug } from '../../../src/debug.js'

debug.config.apiUrl = 'http://unit.test:6543/api'

describe('<WorkspaceAdvanced />', () => {
  const props = {
    setApiUrl: () => { },
    i18n: {},
    registerCustomEventHandlerList: () => { },
    registerLiveMessageHandlerList: () => { },
    t: key => key
  }

  mockGetAppList200(debug.config.apiUrl, [])
  mockGetWorkspaceDetail200(debug.config.apiUrl, workspace.workspace_id, workspace)
  mockGetWorkspaceMember200(debug.config.apiUrl, workspace.workspace_id, false, [])

  const wrapper = shallow(<WorkspaceAdvanced {...props} />)

  describe('its internal functions', () => {
    describe('loadSubscriptionsRequests', () => {
      it('should update subscriptionsRequests state', (done) => {
        mockGetSubscriptionsRequests200(debug.config.apiUrl, workspace.workspace_id, [
          { author: author },
          { workspace: workspace, author: { ...author, user_id: 9 } }
        ])
        wrapper.instance().loadSubscriptionsRequests().then(() => {
          expect(wrapper.state().subscriptionsRequests)
            .to.deep.equal([
              { workspace: workspace, author: { ...author, user_id: 9 } },
              { author: author }
            ])
        }).then(done, done)
      })
    })
  })

  describe('TLM handlers', () => {
    describe('eventType sharedspace', () => {
      describe('handleWorkspaceModified', () => {
        it('should update the sharedspace with new content', () => {
          const tlmData = {
            fields: {
              author: author,
              workspace: { ...workspace, description: 'newDescription' }
            }
          }
          wrapper.instance().handleWorkspaceModified(tlmData)
          expect(wrapper.state('content').description).to.equal(tlmData.fields.workspace.description)
        })
      })
    })

    describe('eventType sharedspace member', () => {
      describe('handleMemberCreated', () => {
        const tlmData = {
          fields: {
            author: author,
            user: user,
            member: { role: 'workspace-manager', do_notify: true },
            workspace: workspace
          }
        }

        before(() => { wrapper.instance().handleMemberCreated(tlmData) })

        it('should add a new member', () => {
          const hasMember = !!(wrapper.state('content').memberList.find(member => member.user_id === tlmData.fields.user.user_id))
          expect(hasMember).to.equal(true)
        })

        it('should have the right role for the new member', () => {
          const member = wrapper.state('content').memberList.find(member => member.user_id === tlmData.fields.user.user_id)
          expect(member.role).to.equal(tlmData.fields.member.role)
        })
      })

      describe('handleMemberModified', () => {
        describe('modify the member role', () => {
          it('should update the member with the new role', () => {
            const tlmData = {
              fields: {
                author: author,
                user: user,
                member: { role: 'contributor', do_notify: true },
                workspace: workspace
              }
            }
            wrapper.instance().handleMemberModified(tlmData)
            const stateMember = wrapper.state('content').memberList.find(member => member.user_id === tlmData.fields.user.user_id)
            expect(stateMember.role).to.equal(tlmData.fields.member.role)
          })
        })
      })

      describe('handleMemberDeleted', () => {
        it("should delete the user from member's list", () => {
          const tlmData = {
            fields: {
              author: author,
              user: user,
              workspace: workspace
            }
          }
          wrapper.instance().handleMemberDeleted(tlmData)
          const hasMember = !!(wrapper.state('content').memberList.find(member => member.user_id === tlmData.fields.user.user_id))
          expect(hasMember).to.equal(false)
        })
      })
    })

    describe('eventType user', () => {
      describe('handleUserModified', () => {
        it("should update the member's username", () => {
          wrapper.setState({ content: { ...wrapper.state('content'), memberList: [user] } })
          const tlmData = { fields: { user: { ...user, username: 'newUsername' } } }
          wrapper.instance().handleUserModified(tlmData)
          const stateMember = wrapper.state('content').memberList.find(member => member.user_id === tlmData.fields.user.user_id)
          expect(stateMember.user.username).to.equal(tlmData.fields.user.username)
        })
      })
    })

    describe('eventType sharedspace subscription', () => {
      describe('handleSubscriptionCreated', () => {
        it('should add a new subscription request', () => {
          const tlmData = {
            fields: {
              author: author,
              user: user,
              subscription: {
                author: author
              },
              workspace: workspace
            }
          }
          wrapper.instance().handleSubscriptionCreated(tlmData)
          const hasRequest = !!(wrapper.state().subscriptionsRequests
            .find(request => request.author.user_id === tlmData.fields.subscription.author.user_id))
          expect(hasRequest).to.equal(true)
        })
      })

      describe('handleSubscriptionModified', () => {
        it('should modified the request', () => {
          wrapper.setState({ subscriptionsRequests: [{ author: author, state: 'PENDING' }]})
          const tlmData = {
            fields: {
              author: author,
              user: user,
              subscription: {
                author: author,
                state: 'ACCEPTED'
              },
              workspace: workspace
            }
          }
          wrapper.instance().handleSubscriptionModified(tlmData)

          const request = wrapper.state().subscriptionsRequests
            .find(request => request.author.user_id === tlmData.fields.subscription.author.user_id)
          expect(request).to.deep.equal(tlmData.fields.subscription)
        })
      })
    })
  })
})
