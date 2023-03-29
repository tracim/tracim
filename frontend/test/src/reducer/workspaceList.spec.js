import { expect } from 'chai'
import workspaceList, { serializeWorkspaceListProps } from '../../../src/reducer/workspaceList.js'
import {
  ADD,
  addWorkspaceList, addWorkspaceMember,
  REMOVE,
  removeWorkspace, removeWorkspaceMember,
  SET,
  setWorkspaceList,
  UPDATE,
  updateWorkspaceDetail,
  updateWorkspaceMember,
  WORKSPACE_DETAIL,
  WORKSPACE_LIST, WORKSPACE_MEMBER
} from '../../../src/action-creator.sync'
import { ROLE, serialize } from 'tracim_frontend_lib'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace'
import { serializeSidebarEntryProps } from '../../../src/reducer/currentWorkspace'
import { globalManagerFromApi } from '../../fixture/user/globalManagerFromApi'

describe('workspaceList reducer', () => {
  describe('actions', () => {
    const initialState = [
      {
        ...serialize({ ...firstWorkspaceFromApi, workspace_id: firstWorkspaceFromApi.workspace_id + 1 }, serializeWorkspaceListProps),
        sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps))
      }
    ]

    const serializedFirstWorkspaceFromApi = serialize(firstWorkspaceFromApi, serializeWorkspaceListProps)

    it('should return the initial state when no action given', () => {
      const rez = workspaceList(initialState, { type: 'nothing that will match', action: {} })
      expect(rez).to.deep.equal(initialState)
    })

    describe(`${SET}/${WORKSPACE_LIST}`, () => {
      const rez = workspaceList(initialState, setWorkspaceList([firstWorkspaceFromApi]))

      it('should return a workspace list with the new list', () => {
        expect(rez).to.deep.equal([
          {
            ...serializedFirstWorkspaceFromApi,
            sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps))
          }
        ])
      })
    })

    describe(`${ADD}/${WORKSPACE_LIST}`, () => {
      const rez = workspaceList(initialState, addWorkspaceList([firstWorkspaceFromApi]))

      it('should return a workspace list with the workspace added', () => {
        expect(rez).to.deep.equal([
          {
            ...serializedFirstWorkspaceFromApi,
            sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps))
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
            label: 'labelChanged',
            sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps))
          }
        ])
      })
    })

    describe(`${ADD}/${WORKSPACE_MEMBER}`, () => {
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

    describe(`${UPDATE}/${WORKSPACE_MEMBER}`, () => {
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

    describe(`${REMOVE}/${WORKSPACE_MEMBER}`, () => {
      const rez = workspaceList(
        [
          ...initialState,
          {
            ...serializedFirstWorkspaceFromApi
          }
        ],
        removeWorkspaceMember(globalManagerFromApi.user_id, firstWorkspaceFromApi.workspace_id)
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
