import { expect } from 'chai'
import workspaceList, { serializeWorkspaceListProps } from '../../../src/reducer/workspaceList.js'
import {
  ADD,
  addWorkspaceList,
  REMOVE,
  removeWorkspace,
  SET,
  setWorkspaceList,
  UPDATE,
  updateWorkspaceDetail,
  WORKSPACE_DETAIL,
  WORKSPACE_LIST
} from '../../../src/action-creator.sync'
import { serialize } from 'tracim_frontend_lib'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace'
import { serializeSidebarEntryProps } from '../../../src/reducer/currentWorkspace'

describe('workspaceList reducer', () => {
  describe('actions', () => {
    const initialState = [
      {
        ...serialize({ ...firstWorkspaceFromApi, workspace_id: firstWorkspaceFromApi.workspace_id + 1 }, serializeWorkspaceListProps),
        sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps)),
        memberList: []
      }
    ]

    it('should return the initial state when no action given', () => {
      const rez = workspaceList(initialState, { type: 'nothing that will match', action: {} })
      expect(rez).to.deep.equal([...initialState])
    })

    describe(`${SET}/${WORKSPACE_LIST}`, () => {
      const rez = workspaceList(initialState, setWorkspaceList([firstWorkspaceFromApi]))

      it('should return a workspace list with the new list', () => {
        expect(rez).to.deep.equal([
          {
            ...serialize(firstWorkspaceFromApi, serializeWorkspaceListProps),
            sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps)),
            memberList: []
          }
        ])
      })
    })

    describe(`${ADD}/${WORKSPACE_LIST}`, () => {
      const rez = workspaceList(initialState, addWorkspaceList([firstWorkspaceFromApi]))

      it('should return a workspace list with the workspace added', () => {
        expect(rez).to.deep.equal([
          ...initialState,
          {
            ...serialize(firstWorkspaceFromApi, serializeWorkspaceListProps),
            sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps)),
            memberList: []
          }
        ])
      })
    })

    describe(`${REMOVE}/${WORKSPACE_LIST}`, () => {
      const rez = workspaceList([...initialState, serialize(firstWorkspaceFromApi, serializeWorkspaceListProps)], removeWorkspace(firstWorkspaceFromApi))

      it('should return a empty workspace list', () => {
        expect(rez).to.deep.equal([...initialState])
      })
    })

    describe(`${UPDATE}/${WORKSPACE_DETAIL}`, () => {
      const rez = workspaceList(
        [...initialState, serialize(firstWorkspaceFromApi, serializeWorkspaceListProps)],
        updateWorkspaceDetail({ ...firstWorkspaceFromApi, label: 'labelChanged' })
      )

      it('should return a workspace list with the workspace correctly updated', () => {
        expect(rez).to.deep.equal([
          ...initialState,
          {
            ...serialize(firstWorkspaceFromApi, serializeWorkspaceListProps),
            label: 'labelChanged',
            sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps))
          }
        ])
      })
    })
  })
})
