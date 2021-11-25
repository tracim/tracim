import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import nock from 'nock'
import {
  mockGetWorkspaces200,
  mockGetWorkspaceMembers200,
  mockGetUsers200,
  mockGetUserDetails200,
  mockPostUser200
} from '../apiMock.js'
import { AdminWorkspaceUser } from '../../src/container/AdminWorkspaceUser.jsx'

const admin = {
  user_id: 1,
  public_name: 'Admin',
  email: 'admin@admin.admin',
  username: 'admin'
}

const adminDetails = {
  ...admin,
  is_active: true,
  profile: 'administrators',
  lang: 'en'
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

const workspace = {
  workspace_id: 1,
  label: 'Hello, world',
  description: ''
}

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
    loggedUser: adminDetails
  }
}

function enableMocks () {
  mockGetUsers200(props.data.config.apiUrl, [admin, user]).persist()
  mockGetUserDetails200(props.data.config.apiUrl, adminDetails).persist()
  mockGetUserDetails200(props.data.config.apiUrl, userDetails).persist()
  mockGetWorkspaces200(props.data.config.apiUrl, [workspace]).persist()
  mockGetWorkspaceMembers200(props.data.config.apiUrl, workspace.workspace_id, []).persist()
}

describe('<AdminWorkspaceUser />', () => {
  afterEach(() => nock.cleanAll())

  describe('intern functions', () => {
    enableMocks()
    const wrapper = shallow(<AdminWorkspaceUser {...props} />)
    const initialName = 'John'
    const initialUsername = 'john'
    const initialEmail = 'john.doe@johndoe.com'
    const initialProfile = 'administrators'
    const initialPassword = 'password'

    describe('handleClickAddUser()', () => {
      describe('adding a new user with a name too small', () => {
        it('should display a warning flash message', async () => {
          const result = await wrapper.instance().handleClickAddUser(
            'a',
            initialUsername,
            initialEmail,
            initialEmail,
            initialProfile,
            initialPassword
          )
          expect(result).to.equal(-1)
        })
      })

      describe('adding a new user with a wrong password', () => {
        const addUserWithDifferentPassword = async (password) => {
          const result = await wrapper.instance().handleClickAddUser(
            initialName,
            initialUsername,
            initialEmail,
            initialProfile,
            password
          )
          return result
        }

        describe('when emailNotificationActivated is disabled', () => {
          it('should display a flash message when the password is not defined', async () => {
            const result = await addUserWithDifferentPassword('')
            expect(result).to.equal(-2)
          })

          it('should display a flash message when the password is not long enough', async () => {
            const result = await addUserWithDifferentPassword('pa')
            expect(result).to.equal(-3)
          })

          it('should display a flash message when the password is too long', async () => {
            const result = await addUserWithDifferentPassword('a'.repeat(530))
            expect(result).to.equal(-4)
          })
        })

        describe('when emailNotificationActivated is enabled', () => {
          const wrapperStateConfig = wrapper.state().config

          before(() => {
            wrapper.setState({
              config: {
                ...wrapperStateConfig,
                system: {
                  ...wrapperStateConfig.system,
                  config: {
                    ...wrapperStateConfig.system.config,
                    email_notification_activated: true
                  }
                }
              }
            })
          })

          after(() => {
            wrapper.setState({
              config: wrapperStateConfig
            })
          })

          it('should display a flash message when the password is not long enough', async () => {
            const result = await addUserWithDifferentPassword('pa')
            expect(result).to.equal(-3)
          })

          it('should display a flash message when the password is too long', async () => {
            const result = await addUserWithDifferentPassword('a'.repeat(530))
            expect(result).to.equal(-4)
          })
        })
      })

      describe('adding a new user with a valid form', () => {
        describe('when emailNotificationActivated is disabled', () => {
          before(() => {
            mockPostUser200(props.data.config.apiUrl)
          })

          it('should display the success flash message', async () => {
            const result = await wrapper.instance().handleClickAddUser(
              initialName,
              initialUsername,
              initialEmail,
              initialProfile,
              initialPassword
            )
            expect(result).to.equal(1)
          })
        })

        describe('when emailNotificationActivated is enabled', () => {
          const wrapperStateConfig = wrapper.state().config
          before(() => {
            wrapper.setState({
              config: {
                ...wrapperStateConfig,
                system: {
                  ...wrapperStateConfig.system,
                  config: {
                    ...wrapperStateConfig.system.config,
                    email_notification_activated: true
                  }
                }
              }
            })
          })

          after(() => {
            wrapper.setState({
              config: wrapperStateConfig
            })
          })

          describe('with a password', () => {
            before(() => {
              mockPostUser200(props.data.config.apiUrl)
            })

            it('should display the success flash message', async () => {
              const result = await wrapper.instance().handleClickAddUser(
                initialName,
                initialUsername,
                initialEmail,
                initialProfile,
                initialPassword
              )
              expect(result).to.equal(1)
            })
          })

          describe('without a password', () => {
            before(() => {
              mockPostUser200(props.data.config.apiUrl)
            })
            it('should display the success flash message', async () => {
              const result = await wrapper.instance().handleClickAddUser(
                initialName,
                initialUsername,
                initialEmail,
                initialProfile,
                ''
              )
              expect(result).to.equal(1)
            })
          })
        })
      })
    })
  })

  describe('TLM handlers', () => {
    describe('eventType workspace', () => {
      props.data.config.type = 'workspace'

      describe('handleWorkspaceCreated', () => {
        it('should add the created workspace to the end of the list', async () => {
          enableMocks()
          const secondWorkspace = {
            workspace_id: 5,
            label: 'A workspace',
            description: ''
          }

          const tlmData = { fields: { workspace: secondWorkspace } }
          const wrapper = shallow(<AdminWorkspaceUser {...props} />)

          await wrapper.instance().handleWorkspaceCreated(tlmData)
          const workspaceList = wrapper.state('content').workspaceList
          const lastWorkspace = workspaceList[workspaceList.length - 1]
          expect(lastWorkspace).to.deep.equal({ ...tlmData.fields.workspace, memberList: [] })
        })
      })

      describe('handleWorkspaceModified', () => {
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)
        const tlmData = { fields: { workspace: workspace } }

        before(() => {
          wrapper.instance().handleWorkspaceModified(tlmData)
        })

        it('should replace the modified workspace', () => {
          const workspaceList = wrapper.state('content').workspaceList
          console.log(workspaceList)
          const lastWorkspace = workspaceList[workspaceList.length - 1]
          expect(lastWorkspace).to.deep.equal({ ...tlmData.fields.workspace, memberList: [] })
        })
      })

      describe('handleWorkspaceDeleted', () => {
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)
        const tlmData = { fields: { workspace: workspace } }

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

      const member = {
        do_notify: true,
        is_active: true,
        role: 'contributor'
      }

      describe('handleWorkspaceMemberCreated', () => {
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)

        before(() => {
          const tlmData = {
            fields: {
              workspace: workspace,
              member: member,
              user: userDetails
            }
          }
          wrapper.instance().handleWorkspaceMemberCreated(tlmData)
        })

        it('should add the created member to the end of the workspace member list', async () => {
          const workspaceList = wrapper.state('content').workspaceList
          const lastWorkspace = workspaceList[workspaceList.length - 1]
          expect(lastWorkspace.memberList).to.deep.equal([{
            ...member,
            user: userDetails,
            user_id: user.user_id,
            workspace: workspace,
            workspace_id: workspace.workspace_id
          }])
        })
      })

      describe('handleWorkspaceMemberDeleted', () => {
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)

        before(() => {
          const tlmData = {
            fields: {
              workspace: workspace,
              member: member,
              user: user
            }
          }
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

      describe('handleUserCreated', () => {
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)

        before(async () => {
          enableMocks()
          const tlmData = { fields: { user: userDetails } }
          await wrapper.instance().handleUserCreated(tlmData)
        })

        it('should add the created user to the end of the users list', async () => {
          const userList = wrapper.state('content').userList
          const lastUser = userList[userList.length - 1]
          expect(lastUser).to.deep.equal(userDetails)
        })
      })

      describe('handleUserDeleted', () => {
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)
        before(async () => {
          const tlmData = { fields: { user: userDetails } }
          await wrapper.instance().handleUserDeleted(tlmData)
        })

        it('should remove the deleted user from the user list', async () => {
          const userList = wrapper.state('content').userList
          expect(userList.length).to.equal(1)
          const lastUser = userList[userList.length - 1]
          expect(lastUser).to.deep.equal(adminDetails)
        })
      })

      describe('handleUserModified', () => {
        const newUserDetails = { ...userDetails, public_name: 'Foo2' }
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)

        it('should update the user list with the modified user', async () => {
          expect(wrapper.state('content').userList.length).to.equal(2)
          const tlmData = { fields: { user: newUserDetails } }
          nock.cleanAll()
          mockGetUserDetails200(props.data.config.apiUrl, newUserDetails)
          await wrapper.instance().handleUserModified(tlmData)
          const userList = wrapper.state('content').userList
          const actualUser = userList.find(u => userDetails.user_id === u.user_id)
          expect(actualUser).to.deep.equal(newUserDetails)
        })
      })
    })
  })
})
