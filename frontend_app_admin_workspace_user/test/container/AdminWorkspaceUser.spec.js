import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import {
  mockGetWorkspaces200,
  mockGetWorkspaceMembers200,
  mockGetUsers200,
  mockGetUserDetails200
} from '../apiMock.js'
import { AdminWorkspaceUser } from '../../src/container/AdminWorkspaceUser.jsx'

describe('<AdminWorkspaceUser />', () => {
  const props = {
    i18n: {},
    registerCustomEventHandlerList: () => { },
    registerLiveMessageHandlerList: () => { },
    t: key => key,
    data: {
      content: {
        workspaceList: [],
        userList: []
      },
      config: {
        type: 'workspace',
        translation: {},
        apiUrl: 'http://localhost/api',
        system: {
          config: {
            email_notification_activated: false
          }
        }
      },
      loggedUser: {
        lang: 'en',
        user_id: 1
      }
    }
  }

  describe('TLM handlers', () => {
    describe('eventType workspace', () => {
      props.data.config.type = 'workspace'
      mockGetWorkspaces200(props.data.config.apiUrl, [{ workspace_id: 1, label: 'Hello', description: '' }]).persist()
      mockGetWorkspaceMembers200(props.data.config.apiUrl, 1, []).persist()

      describe('handleWorkspaceCreated', () => {

        const workspace = {
          workspace_id: 5,
          label: 'A workspace',
          description: ''
        }
        mockGetWorkspaceMembers200(props.data.config.apiUrl, workspace.workspace_id, [])

        const tlmData = {
          workspace: workspace
        }
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)

        before(() => {
          wrapper.instance().handleWorkspaceCreated(tlmData)
        })

        it('should add the created workspace to the end of the list', () => {
          const workspaceList = wrapper.state('content').workspaceList
          const lastWorkspace = workspaceList[workspaceList.length - 1]
          expect(lastWorkspace).to.deep.equal({ ...tlmData.workspace, memberList: [] })
        })
      })

      describe('handleWorkspaceModified', () => {

        const workspace = {
          workspace_id: 1,
          label: 'Hello, world',
          description: ''
        }

        const wrapper = shallow(<AdminWorkspaceUser {...props} />)
        const tlmData = {
          workspace: workspace
        }
        before(() => {
          wrapper.instance().handleWorkspaceModified(tlmData)
        })
        it('should replace the modified workspace', () => {
          const workspaceList = wrapper.state('content').workspaceList
          const lastWorkspace = workspaceList[workspaceList.length - 1]
          expect(lastWorkspace).to.deep.equal({ ...tlmData.workspace, memberList: [] })
        })
      })

      describe('handleWorkspaceDeleted', () => {

        const workspace = {
          workspace_id: 1,
          label: 'Hello, world',
          description: ''
        }

        const wrapper = shallow(<AdminWorkspaceUser {...props} />)
        const tlmData = {
          workspace: workspace
        }
        before(() => {
          wrapper.instance().handleWorkspaceDeleted(tlmData)
        })

        it('should remove the deleted workspace', () => {
          const workspaceList = wrapper.state('content').workspaceList
          expect(workspaceList.length).to.equal(0)
        })
      })
    })

    describe('eventType workspace members', () => {
      props.data.config.type = 'workspace'
      mockGetWorkspaces200(props.data.config.apiUrl, [{ workspace_id: 1, label: 'Hello', description: '' }]).persist()

      const workspace = {
        workspace_id: 1,
        label: 'A workspace',
        description: ''
      }
      const member = {
        user_id: 1,
        user: props.data.loggedUser,
        workspace: workspace,
        role: 'contributor'
      }

      describe('handleWorkspaceMemberCreated', () => {
        mockGetWorkspaceMembers200(props.data.config.apiUrl, 1, [])
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)

        const tlmData = {
          workspace: workspace,
          member: member
        }
        before(() => {
          wrapper.instance().handleWorkspaceMemberCreated(tlmData)
        })
        it('should add the created member to the end of the workspace\'s member list', () => {
          const workspaceList = wrapper.state('content').workspaceList
          const lastWorkspace = workspaceList[workspaceList.length - 1]
          expect(lastWorkspace.memberList).to.deep.equal([member])
        })
      })

      describe('handleWorkspaceMemberDeleted', () => {
        mockGetWorkspaceMembers200(props.data.config.apiUrl, 1, [member])
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)
        const tlmData = {
          workspace: workspace,
          member: member
        }
        before(() => {
          wrapper.instance().handleWorkspaceMemberDeleted(tlmData)
        })
        it('should remove the deleted member from the workspace\'s member list', () => {
          const workspaceList = wrapper.state('content').workspaceList
          const lastWorkspace = workspaceList[workspaceList.length - 1]
          expect(lastWorkspace.memberList).to.deep.equal([])
        })
      })
    })

    describe('eventType users', () => {
      props.data.config.type = 'user'
      const admin = {
        user_id: 1,
        public_name: 'Admin',
        email: 'admin@admin.admin',
        username: 'admin'
      }
      const adminDetails = {
        ...admin,
        is_active: true,
        profile: 'administrators'
      }
      const user = {
        user_id: 2,
        public_name: 'Foo',
        email: 'foo@foo.fo',
        username: 'foo'
      }
      const userDetails = {
        ...user,
        is_active: true,
        profile: 'users'
      }

      describe('handleUserCreated', () => {
        mockGetUsers200(props.data.config.apiUrl, [admin])
        mockGetUserDetails200(props.data.config.apiUrl, adminDetails)
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)
        const tlmData = {
          user: userDetails
        }

        before(() => {
          wrapper.instance().handleUserCreated(tlmData)
        })
        it('should add the created user to the end of the users list', () => {
          const userList = wrapper.state('content').userList
          const lastUser = userList[userList.length - 1]
          expect(lastUser).to.deep.equal(userDetails)
        })
      })

      describe('handleUserDeleted', () => {
        mockGetUsers200(props.data.config.apiUrl, [admin, user])
        mockGetUserDetails200(props.data.config.apiUrl, adminDetails)
        mockGetUserDetails200(props.data.config.apiUrl, userDetails)
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)
        const tlmData = {
          user: userDetails
        }
        before(() => {
          wrapper.instance().handleUserDeleted(tlmData)
        })
        it('should remove the deleted user from the user list', () => {
          const userList = wrapper.state('content').userList
          expect(userList.length).to.equal(1)
          const lastUser = userList[userList.length - 1]
          expect(lastUser).to.deep.equal(adminDetails)
        })
      })

      describe('handleUserModified', () => {
        mockGetUsers200(props.data.config.apiUrl, [admin, user])
        mockGetUserDetails200(props.data.config.apiUrl, adminDetails)
        mockGetUserDetails200(props.data.config.apiUrl, userDetails)
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)
        const tlmData = {
          user: { ...userDetails, public_name: 'Foo2' }
        }
        before(() => {
          wrapper.instance().handleUserModified(tlmData)
        })
        it('should update the user list with the message\'s user', () => {
          const userList = wrapper.state('content').userList
          const lastUser = userList[userList.length - 1]
          expect(lastUser).to.deep.equal(tlmData.user)
        })
      })
    })
  })
})
