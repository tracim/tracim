import React from 'react'
import { shallow } from 'enzyme'
import { expect } from 'chai'
import { Agenda } from '../src/container/Agenda.jsx'
import { user, workspace } from 'tracim_frontend_lib/dist/tracim_frontend_lib.test_utils.js'
import { debug } from '../src/debug.js'
import {
  mockGetAgendaList200,
  mockGetWorkspaceDetail200,
  mockGetWorkspaceMemberList200
} from './apiMock.js'

describe('<Agenda />', () => {
  const userWorkspaceList = [{
    workspace_id: workspace.workspace_id,
    with_credentials: true,
    agenda_url: '',
    agenda_type: 'workspace'
  }]

  const props = {
    ...debug,
    config: {
      ...debug.config,
      apiUrl: 'http://localhost'
    }
  }

  mockGetAgendaList200(props.config.apiUrl, workspace.workspace_id, userWorkspaceList)
  mockGetWorkspaceDetail200(props.config.apiUrl, workspace.workspace_id, workspace)
  mockGetWorkspaceMemberList200(props.config.apiUrl, workspace.workspace_id, [user])

  const wrapper = shallow(
    <Agenda
      i18n={{}}
      registerLiveMessageHandlerList={() => { }}
      registerCustomEventHandlerList={() => { }}
      t={key => key}
      data={props}
    />
  )

  describe('TLM Handlers', () => {
    describe('eventType user', () => {
      describe('handleUserModified', () => {
        it('should update loggedUser state', () => {
          const tlmData = {
            fields: {
              author: user,
              user: {
                ...user,
                public_name: 'newPublicName'
              }
            }
          }
          wrapper.instance().handleUserModified(tlmData)
          expect(wrapper.state('loggedUser').publicName).to.equal(tlmData.fields.user.public_name)
        })

        it('should have showRefreshWarning state as false if changes just the user language', () => {
          const tlmData = {
            fields: {
              author: user,
              user: {
                ...user,
                lang: 'otherLang'
              }
            }
          }
          wrapper.instance().handleUserModified(tlmData)
          expect(wrapper.state('showRefreshWarning')).to.equal(false)
        })
      })
    })

    describe('eventType sharedspace', () => {
      describe('handleSharedspaceModified', () => {
        it('should update workspaceLabel state', () => {
          const tlmData = {
            fields: {
              author: user,
              workspace: {
                ...workspace,
                label: 'newWorkspaceLabel'
              }
            }
          }
          wrapper.setState({ userWorkspaceList: userWorkspaceList })
          wrapper.instance().handleSharedspaceModified(tlmData)
          expect(wrapper.state('content').workspaceLabel).to.equal(tlmData.fields.workspace.label)
        })
      })
    })
  })
})
