import React from 'react'
import { expect } from 'chai'
import sinon from 'sinon'
import { shallow } from 'enzyme'
import {
  mockGetWorkspaces200,
  mockGetWorkspaceMembers200,
  mockGetUsers200,
  mockGetUserDetails200,
  mockPostUser200
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

  describe('intern functions', () => {
    mockGetWorkspaces200(
      props.data.config.apiUrl,
      [{ workspace_id: 1, label: 'Hello', description: '' }]
    ).persist()
    const wrapper = shallow(<AdminWorkspaceUser {...props} />)
    const initialName = 'John'
    const initialUsername = 'john'
    const initialEmail = 'john.doe@johndoe.com'
    const initialProfile = 'administrators'
    const initialPassword = 'password'

    describe('handleClickAddUser()', () => {
      const sendGlobalFlashMsgSpy = sinon.spy()
      const initialSendGlobalFlashMsg = wrapper.instance().sendGlobalFlashMsg
      wrapper.instance().sendGlobalFlashMsg = sendGlobalFlashMsgSpy

      after(() => {
        wrapper.instance().sendGlobalFlashMsg = initialSendGlobalFlashMsg
      })

      describe('adding a new user with a name too small', () => {
        before(() => {
          wrapper.instance().handleClickAddUser(
            'a',
            initialUsername,
            initialEmail,
            initialEmail,
            initialProfile,
            initialPassword
          )
        })

        afterEach(() => {
          sendGlobalFlashMsgSpy.resetHistory()
        })

        it('should display a warning flash message', () => {
          expect(sendGlobalFlashMsgSpy.calledOnceWith(
            props.t('Full name must be at least {{minimumCharactersPublicName}} characters')
          )).to.equal(true)
        })
      })

      describe('adding a new user with a wrong password', () => {
        const addUserWithDifferentPassword = password => {
          wrapper.instance().handleClickAddUser(
            initialName,
            initialUsername,
            initialEmail,
            initialProfile,
            password
          )
        }

        describe('when emailNotificationActivated is disabled', () => {
          afterEach(() => {
            sendGlobalFlashMsgSpy.resetHistory()
          })

          it('should display a flash message when the password is not defined', () => {
            addUserWithDifferentPassword('')
            expect(sendGlobalFlashMsgSpy.calledOnceWith(
              props.t('Please set a password')
            )).to.equal(true)
          })

          it('should display a flash message when the password is not long enough', () => {
            addUserWithDifferentPassword('pa')
            expect(sendGlobalFlashMsgSpy.calledOnceWith(
              props.t('New password is too short (minimum 6 characters)')
            )).to.equal(true)
          })

          it('should display a flash message when the password is too long', () => {
            let password = ''
            for (let i = 0; i < 530; i++) {
              password += 'a'
            }
            addUserWithDifferentPassword(password)
            expect(sendGlobalFlashMsgSpy.calledOnceWith(
              props.t('New password is too long (maximum 512 characters)')
            )).to.equal(true)
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

          afterEach(() => {
            sendGlobalFlashMsgSpy.resetHistory()
          })

          it('should display a flash message when the password is not long enough', () => {
            addUserWithDifferentPassword('pa')
            expect(sendGlobalFlashMsgSpy.calledOnceWith(
              props.t('New password is too short (minimum 6 characters)')
            )).to.equal(true)
          })

          it('should display a flash message when the password is too long', () => {
            let password = ''
            for (let i = 0; i < 530; i++) {
              password += 'a'
            }
            addUserWithDifferentPassword(password)
            expect(sendGlobalFlashMsgSpy.calledOnceWith(
              props.t('New password is too long (maximum 512 characters)')
            )).to.equal(true)
          })
        })
      })

      describe('adding a new user with a valid form', () => {
        describe('when emailNotificationActivated is disabled', () => {
          before(() => {
            mockPostUser200(props.data.config.apiUrl)
            wrapper.instance().handleClickAddUser(
              initialName,
              initialUsername,
              initialEmail,
              initialProfile,
              initialPassword
            )
          })

          afterEach(() => {
            sendGlobalFlashMsgSpy.resetHistory()
          })

          it('should display the success flash message', () => {
            expect(sendGlobalFlashMsgSpy.calledOnceWith(
              props.t('User created')
            )).to.equal(true)
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

          afterEach(() => {
            sendGlobalFlashMsgSpy.resetHistory()
          })

          describe('with a password', () => {
            before(() => {
              mockPostUser200(props.data.config.apiUrl)
              wrapper.instance().handleClickAddUser(
                initialName,
                initialUsername,
                initialEmail,
                initialProfile,
                initialPassword
              )
            })

            it('should display the success flash message', () => {
              expect(sendGlobalFlashMsgSpy.calledOnceWith(
                props.t('User created and email sent')
              )).to.equal(true)
            })
          })

          describe('without a password', () => {
            before(() => {
              mockPostUser200(props.data.config.apiUrl)
              wrapper.instance().handleClickAddUser(
                initialName,
                initialUsername,
                initialEmail,
                initialProfile,
                ''
              )
            })
            it('should display the success flash message', () => {
              expect(sendGlobalFlashMsgSpy.calledOnceWith(
                props.t('User created and email sent')
              )).to.equal(true)
            })
          })
        })
      })
    })
  })

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

        const tlmData = { fields: { workspace: workspace } }
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)

        before(() => {
          wrapper.instance().handleWorkspaceCreated(tlmData)
        })

        it('should add the created workspace to the end of the list', () => {
          const workspaceList = wrapper.state('content').workspaceList
          const lastWorkspace = workspaceList[workspaceList.length - 1]
          expect(lastWorkspace).to.deep.equal({ ...tlmData.fields.workspace, memberList: [] })
        })
      })

      describe('handleWorkspaceModified', () => {
        const workspace = {
          workspace_id: 1,
          label: 'Hello, world',
          description: ''
        }

        const wrapper = shallow(<AdminWorkspaceUser {...props} />)
        const tlmData = { fields: { workspace: workspace } }
        before(() => {
          wrapper.instance().handleWorkspaceModified(tlmData)
        })
        it('should replace the modified workspace', () => {
          const workspaceList = wrapper.state('content').workspaceList
          const lastWorkspace = workspaceList[workspaceList.length - 1]
          expect(lastWorkspace).to.deep.equal({ ...tlmData.fields.workspace, memberList: [] })
        })
      })

      describe('handleWorkspaceDeleted', () => {
        const workspace = {
          workspace_id: 1,
          label: 'Hello, world',
          description: ''
        }

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
      mockGetWorkspaces200(props.data.config.apiUrl, [{ workspace_id: 1, label: 'Hello', description: '' }]).persist()

      const workspace = {
        workspace_id: 1,
        label: 'A workspace',
        description: ''
      }
      const member = {
        do_notify: true,
        role: 'contributor'
      }
      const user = {
        ...props.data.loggedUser,
        is_active: true
      }

      describe('handleWorkspaceMemberCreated', () => {
        mockGetWorkspaceMembers200(props.data.config.apiUrl, 1, [])
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)

        const tlmData = {
          fields: {
            workspace: workspace,
            member: member,
            user: user
          }
        }
        before(() => {
          wrapper.instance().handleWorkspaceMemberCreated(tlmData)
        })
        it('should add the created member to the end of the workspace\'s member list', () => {
          const workspaceList = wrapper.state('content').workspaceList
          const lastWorkspace = workspaceList[workspaceList.length - 1]
          expect(lastWorkspace.memberList).to.deep.equal([{
            ...member,
            is_active: user.is_active,
            user: user,
            user_id: user.user_id,
            workspace: workspace,
            workspace_id: workspace.workspace_id
          }])
        })
      })

      describe('handleWorkspaceMemberDeleted', () => {
        mockGetWorkspaceMembers200(props.data.config.apiUrl, 1, [member])
        const wrapper = shallow(<AdminWorkspaceUser {...props} />)
        const tlmData = {
          fields: {
            workspace: workspace,
            member: member,
            user: user
          }
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
        const tlmData = { fields: { user: userDetails } }

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
        const tlmData = { fields: { user: userDetails } }
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
          fields: {
            user: { ...userDetails, public_name: 'Foo2' }
          }
        }
        before(() => {
          wrapper.instance().handleUserModified(tlmData)
        })
        it('should update the user list with the message\'s user', () => {
          const userList = wrapper.state('content').userList
          const lastUser = userList[userList.length - 1]
          expect(lastUser).to.deep.equal(tlmData.fields.user)
        })
      })
    })
  })
})
