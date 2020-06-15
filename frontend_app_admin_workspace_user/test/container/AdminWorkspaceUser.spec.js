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
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)

        it('should add the created workspace to the end of the list', async () => {
          const tlmData = {
            workspace: workspace
          }
          const previousWorkspaceListLength = wrapper.state('content').workspaceList.length
          await wrapper.instance().handleWorkspaceCreated(tlmData)
          const workspaceList = wrapper.state('content').workspaceList
          expect(workspaceList.length).to.equal(previousWorkspaceListLength + 1)
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

        it('should replace the modified workspace', async () => {
          const tlmData = {
            workspace: workspace
          }
          const previousWorkspaceListLength = wrapper.state('content').workspaceList.length
          wrapper.instance().handleWorkspaceModified(tlmData)
          const workspaceList = wrapper.state('content').workspaceList
          expect(workspaceList.length).to.equal(previousWorkspaceListLength)
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

        it('should remove the deleted workspace', async () => {
          const tlmData = {
            workspace: workspace
          }
          const previousWorkspaceListLength = wrapper.state('content').workspaceList.length
          wrapper.instance().handleWorkspaceDeleted(tlmData)
          const workspaceList = wrapper.state('content').workspaceList
          expect(workspaceList.length).to.equal(previousWorkspaceListLength-1)
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

        it('should add the created member to the end of the workspace\'s member list', async () => {
          const tlmData = {
            workspace: workspace,
            member: member
          }
          wrapper.instance().handleWorkspaceMemberCreated(tlmData)
          const workspaceList = wrapper.state('content').workspaceList
          const lastWorkspace = workspaceList[workspaceList.length - 1]
          expect(lastWorkspace.memberList).to.deep.equal([member])
        })
      })

      describe('handleWorkspaceMemberDeleted', () => {
        mockGetWorkspaceMembers200(props.data.config.apiUrl, 1, [member])
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)

        it('should remove the deleted member from the workspace\'s member list', async () => {
          const tlmData = {
            workspace: workspace,
            member: member
          }
          wrapper.instance().handleWorkspaceMemberDeleted(tlmData)
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

        it('should add the created user to the end of the users list', async () => {
          const tlmData = {
            user: userDetails
          }
          wrapper.instance().handleUserCreated(tlmData)
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

        it('should remove the deleted user from the user list', async () => {
          const tlmData = {
            user: userDetails
          }
          wrapper.instance().handleUserDeleted(tlmData)
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

        it('should update the user list with the message\'s user', async () => {
          const tlmData = {
            user: { ...userDetails, public_name: 'Foo2' }
          }
          wrapper.instance().handleUserModified(tlmData)
          const userList = wrapper.state('content').userList
          const lastUser = userList[userList.length - 1]
          expect(lastUser).to.deep.equal(tlmData.user)
        })
      })
    })
  })
})