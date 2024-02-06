import { expect } from 'chai'
import { workspaceList, serializeUserConfig, serializeWorkspaceListProps } from '../../../src/reducer/workspaceList.js'
import {
  ADD,
  ADD_USER_WORKSPACE_CONFIG_LIST,
  addWorkspaceMember,
  REMOVE,
  REMOVE_USER_ROLE,
  removeWorkspace,
  removeUserRole,
  SET,
  setUserWorkspaceConfigList,
  UPDATE,
  updateWorkspaceDetail,
  updateWorkspaceMember,
  UPDATE_USER_WORKSPACE_CONFIG_LIST,
  addUserWorkspaceConfigList,
  updateUserWorkspaceConfigList,
  WORKSPACE_DETAIL,
  WORKSPACE_LIST,
  USER_ROLE,
  USER_WORKSPACE_CONFIG_LIST
} from '../../../src/action-creator.sync'
import { ROLE, serialize } from 'tracim_frontend_lib'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace'
import { serializeSidebarEntryProps } from '../../../src/reducer/currentWorkspace'
import { globalManagerFromApi } from '../../fixture/user/globalManagerFromApi'
import { globalManagerSetting, globalManagerSettingReader } from '../../fixture/user/globalManagerSetting.js'
import { globalManagerAsMemberFromApi } from '../../fixture/user/globalManagerAsMember'
import { globalManagerWorkspaceFromApi } from '../../fixture/workspace/globalManagerWorkspce.js'

describe('workspaceList reducer', () => {
  describe('actions', () => {
    const initialState = [
      {
        ...serialize(
          { ...firstWorkspaceFromApi, workspace_id: firstWorkspaceFromApi.workspace_id + 1 },
          serializeWorkspaceListProps
        ),
        sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(
          sbe => serialize(sbe, serializeSidebarEntryProps)
        )
      }
    ]

    const serializedFirstWorkspaceFromApi = serialize(
      firstWorkspaceFromApi, serializeWorkspaceListProps
    )

    it('should return the initial state when no action given', () => {
      const rez = workspaceList(initialState, { type: 'nothing that will match', action: {} })
      expect(rez).to.deep.equal(initialState)
    })

    describe(`${SET}/${USER_WORKSPACE_CONFIG_LIST}`, () => {
      const rez = workspaceList(initialState, setUserWorkspaceConfigList([globalManagerWorkspaceFromApi]))

      it('should return a workspace list with the new list', () => {
        expect(rez).to.deep.equal([
          {
            ...serializedFirstWorkspaceFromApi,
            sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(
              sbe => serialize(sbe, serializeSidebarEntryProps)
            ),
            memberList: [serializeUserConfig(globalManagerAsMemberFromApi)
            ]
          }
        ])
      })
    })

    describe(ADD_USER_WORKSPACE_CONFIG_LIST, () => {
      const rez = workspaceList(
        initialState,
        addUserWorkspaceConfigList(globalManagerFromApi, globalManagerSetting, firstWorkspaceFromApi)
      )

      it('should return a workspace list with the workspace added', () => {
        expect(rez).to.deep.equal([
          {
            ...serializedFirstWorkspaceFromApi,
            sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(
              sbe => serialize(sbe, serializeSidebarEntryProps)
            ),
            memberList: [serializeUserConfig(globalManagerAsMemberFromApi)]
          },
          ...initialState
        ])
      })
    })

    describe(UPDATE_USER_WORKSPACE_CONFIG_LIST, () => {
      const rez = workspaceList(
        [...initialState, serializedFirstWorkspaceFromApi],
        updateUserWorkspaceConfigList(
          globalManagerFromApi,
          globalManagerSettingReader,
          firstWorkspaceFromApi
        )
      )

      it('should return a workspace list with the workspace updated', () => {
        expect(rez).to.deep.equal([
          {
            ...serializedFirstWorkspaceFromApi,
            sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(
              sbe => serialize(sbe, serializeSidebarEntryProps)
            ),
            memberList: [{
              ...serializeUserConfig(globalManagerAsMemberFromApi),
              role: ROLE.reader.slug
            }]
          },
          ...initialState
        ])
      })
    })

    describe(`${REMOVE}/${WORKSPACE_LIST}`, () => {
      const rez = workspaceList([...initialState, serializedFirstWorkspaceFromApi], removeWorkspace(firstWorkspaceFromApi))

      it('should return a empty workspace list', () => {
        expect(rez).to.deep.equal(initialState)
      })
    })

    describe(`${UPDATE}/${WORKSPACE_DETAIL}`, () => {
      const rez = workspaceList(
        [...initialState, serializedFirstWorkspaceFromApi],
        updateWorkspaceDetail({ ...firstWorkspaceFromApi, label: 'labelChanged' })
      )

      it('should return a workspace list with the workspace correctly updated', () => {
        expect(rez).to.deep.equal([
          ...initialState,
          {
            ...serializedFirstWorkspaceFromApi,
            label: 'labelChanged'
          }
        ])
      })
    })

    describe(`${ADD}/${USER_ROLE}`, () => {
      it('should return a workspace list with the member correctly added in the right workspace', () => {
        const rez = workspaceList(
          [
            ...initialState,
            {
              ...serializedFirstWorkspaceFromApi
            }
          ],
          addWorkspaceMember(
            globalManagerFromApi,
            firstWorkspaceFromApi.workspace_id,
            { ...globalManagerFromApi, email_notification_type: 'summary', role: ROLE.workspaceManager }
          )
        )

        expect(rez).to.deep.equal([
          ...initialState,
          {
            ...serializedFirstWorkspaceFromApi
          }
        ])
      })

      it('should return a uniq by id object the same member is added twice', () => {
        const initialStateWithMember = [
          ...initialState,
          {
            ...serializedFirstWorkspaceFromApi
          }
        ]
        const rez = workspaceList(
          initialStateWithMember,
          addWorkspaceMember(
            globalManagerFromApi,
            initialState.id,
            { id: globalManagerFromApi.user_id }
          )
        )

        expect(rez).to.deep.equal(initialStateWithMember)
      })
    })

    describe(`${UPDATE}/${USER_ROLE}`, () => {
      const rez = workspaceList(
        [
          ...initialState,
          {
            ...serializedFirstWorkspaceFromApi
          }
        ],
        updateWorkspaceMember(globalManagerFromApi, firstWorkspaceFromApi.workspace_id, { user: globalManagerFromApi, email_notification_type: 'none', role: ROLE.contributor })
      )

      it('should return a workspace list with the member correctly updated in the right workspace', () => {
        expect(rez).to.deep.equal([
          ...initialState,
          {
            ...serializedFirstWorkspaceFromApi
          }
        ])
      })
    })

    describe(REMOVE_USER_ROLE, () => {
      const rez = workspaceList(
        [
          ...initialState,
          {
            ...serializedFirstWorkspaceFromApi
          }
        ],
        removeUserRole(globalManagerFromApi.user_id, firstWorkspaceFromApi.workspace_id)
      )

      it('should return a workspace list without the member removed in the right workspace', () => {
        expect(rez).to.deep.equal([
          ...initialState,
          {
            ...serializedFirstWorkspaceFromApi
          }
        ])
      })
    })
  })
})
