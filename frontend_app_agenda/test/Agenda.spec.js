import React from 'react'
import { shallow } from 'enzyme'
import { expect } from 'chai'
import { Agenda } from '../src/container/Agenda.jsx'
import { user, workspace } from 'tracim_frontend_lib/dist/tracim_frontend_lib.test_utils.js'
import { debug } from '../src/helper.js'
import {
  mockGetAgendaList200,
  mockGetWorkspaceDetail200,
  mockGetWorkspaceMemberList200
} from './apiMock.js'

describe('<Agenda />', () => {
  const props = {
    i18n: {},
    registerLiveMessageHandlerList: () => { },
    registerCustomEventHandlerList: () => { },
    t: key => key
  }

  const userWorkspaceList = [{
    workspace_id: workspace.workspace_id,
    with_credentials: true,
    agenda_url: '',
    agenda_type: 'workspace'
  }]

  mockGetAgendaList200(debug.config.apiUrl, workspace.workspace_id, userWorkspaceList)
  mockGetWorkspaceDetail200(debug.config.apiUrl, workspace.workspace_id, workspace)
  mockGetWorkspaceMemberList200(debug.config.apiUrl, workspace.workspace_id, [user])

  const wrapper = shallow(<Agenda {...props} />)

  describe('TLM Handlers', () => {
    describe('eventType user', () => {
      describe('handleUserModified', () => {
        it('should update loggedUser state', () => {
          const tlmData = {
            author: user,
            user: {
              ...user,
              public_name: 'newPublicName'
            }
          }
          wrapper.instance().handleUserModified(tlmData)
          expect(wrapper.state('loggedUser').publicName).to.equal(tlmData.user.public_name)
        })
      })
    })

    describe('eventType sharedspace', () => {
      describe('handleSharedspaceModified', () => {
        it('should update workspaceLabel state', () => {
          const tlmData = {
            author: user,
            workspace: {
              ...workspace,
              label: 'newWorkspaceLabel'
            }
          }
          wrapper.setState({ userWorkspaceList: userWorkspaceList })
          wrapper.instance().handleSharedspaceModified(tlmData)
          expect(wrapper.state('content').workspaceLabel).to.equal(tlmData.workspace.label)
        })
      })
    })
  })
})
