import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { author, user, workspace } from 'tracim_frontend_lib/dist/tracim_frontend_lib.test_utils.js'
import { WorkspaceAdvanced } from '../../../src/container/WorkspaceAdvanced.jsx'
import {
  mockGetAppList200,
  mockGetWorkspaceDetail200,
  mockGetWorkspaceMember200
} from '../../apiMock.js'
import { debug } from '../../../src/debug.js'

describe('<WorkspaceAdvanced />', () => {
  const props = {
    setApiUrl: () => {},
    loggedUser: {
      userId: 1
    },
    content: {
      workspace: workspace
    },
    i18n: {},
    registerCustomEventHandlerList: () => { },
    registerLiveMessageHandlerList: () => { },
    t: key => key
  }

  mockGetAppList200(debug.config.apiUrl, [])
  mockGetWorkspaceDetail200(debug.config.apiUrl, workspace.workspace_id, workspace).persist()
  mockGetWorkspaceMember200(debug.config.apiUrl, workspace.workspace_id, false, [])

  const wrapper = shallow(<WorkspaceAdvanced {...props} />)

  describe('TLM handlers', () => {
    describe('eventType sharedspace', () => {
      describe('handleWorkspaceModified', () => {
        it('should update the sharedspace with new content', () => {
          const tlmData = {
            author: author,
            workspace: { ...workspace, description: 'newDescription' }
          }
          wrapper.instance().handleWorkspaceModified(tlmData)
          expect(wrapper.state('content').description).to.equal(tlmData.workspace.description)
        })
      })
    })

    describe('eventType sharedspace member', () => {
      describe('handleMemberCreated', () => {
        const tlmData = {
          author: author,
          user: user,
          member: { role: 'workspace-manager', do_notify: true },
          workspace: workspace
        }
        wrapper.instance().handleMemberCreated(tlmData)
        it('should add a new member', () => {
          expect(wrapper.state('content').memberList[wrapper.state('content').memberList.length - 1].user_id).to.equal(tlmData.user.user_id)
        })
        it('should have the right role for the new member', () => {
          expect(wrapper.state('content').memberList[wrapper.state('content').memberList.length - 1].role).to.equal(tlmData.member.role)
        })
      })
    })

    describe('handleMemberModified', () => {
      describe('modify the member role', () => {
        const tlmData = {
          author: author,
          user: user,
          member: { role: 'contributor', do_notify: true },
          workspace: workspace
        }

        it('should update the member with the new role', () => {
          wrapper.instance().handleMemberModified(tlmData)
          const stateMember = wrapper.state('content').memberList.find(member => member.user_id === tlmData.user.user_id)
          expect(stateMember.role).to.equal(tlmData.member.role)
        })
      })
    })

    describe('handleMemberDeleted', () => {
      it("should delete the user from member's list", () => {
        const tlmData = {
          author: author,
          user: user,
          workspace: workspace
        }
        wrapper.instance().handleMemberDeleted(tlmData)

        const hasMember = !!(wrapper.state('content').memberList.find(member => member.user_id === tlmData.user.user_id))
        expect(hasMember).to.equal(false)
      })
    })
  })
})
