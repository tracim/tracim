import { expect } from 'chai'
import workspaceList, { serializeWorkspaceListProps } from '../../../src/reducer/workspaceList.js'
import {
  ADD,
  addWorkspaceList, addWorkspaceMember,
  REMOVE,
  removeWorkspace, removeWorkspaceMember,
  SET,
  setWorkspaceList, setWorkspaceListMemberList,
  UPDATE,
  updateWorkspaceDetail,
  updateWorkspaceMember,
  WORKSPACE_DETAIL,
  WORKSPACE_LIST, WORKSPACE_MEMBER
} from '../../../src/action-creator.sync'
import { ROLE, serialize } from 'tracim_frontend_lib'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace'
import { serializeMember, serializeSidebarEntryProps } from '../../../src/reducer/currentWorkspace'
import { globalManagerFromApi } from '../../fixture/user/globalManagerFromApi'

describe('workspaceList reducer', () => {
  describe('actions', () => {
    const initialState = [
      {
        ...serialize({ ...firstWorkspaceFromApi, workspace_id: firstWorkspaceFromApi.workspace_id + 1 }, serializeWorkspaceListProps),
        sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps)),
        memberList: []
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
          {
            ...serializedFirstWorkspaceFromApi,
            sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps)),
            memberList: []
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
      const rez = workspaceList(
        [
          ...initialState,
          {
            ...serializedFirstWorkspaceFromApi,
            memberList: []
          }
        ],
        addWorkspaceMember(globalManagerFromApi, firstWorkspaceFromApi.workspace_id, { ...globalManagerFromApi, do_notify: true, role: ROLE.workspaceManager })
      )

      it('should return a workspace list with the member correctly added in the right workspace', () => {
        expect(rez).to.deep.equal([
          ...initialState,
          {
            ...serializedFirstWorkspaceFromApi,
            memberList: [{
              ...serializeMember({
                user: globalManagerFromApi,
                do_notify: true,
                role: ROLE.workspaceManager
              })
            }]
          }
        ])
      })
    })

    describe(`${UPDATE}/${WORKSPACE_MEMBER}`, () => {
      const rez = workspaceList(
        [
          ...initialState,
          {
            ...serializedFirstWorkspaceFromApi,
            memberList: [{
              ...serializeMember({
                user: globalManagerFromApi,
                do_notify: true,
                role: ROLE.workspaceManager
              })
            }]
          }
        ],
        updateWorkspaceMember(globalManagerFromApi, firstWorkspaceFromApi.workspace_id, { user: globalManagerFromApi, do_notify: false, role: ROLE.contributor })
      )

      it('should return a workspace list with the member correctly updated in the right workspace', () => {
        expect(rez).to.deep.equal([
          ...initialState,
          {
            ...serializedFirstWorkspaceFromApi,
            memberList: [{
              ...serializeMember({
                user: globalManagerFromApi,
                do_notify: false,
                role: ROLE.contributor
              })
            }]
          }
        ])
      })
    })

    describe(`${REMOVE}/${WORKSPACE_MEMBER}`, () => {
      const rez = workspaceList(
        [
          ...initialState,
          {
            ...serializedFirstWorkspaceFromApi,
            memberList: [{
              ...serializeMember({
                user: globalManagerFromApi,
                do_notify: true,
                role: ROLE.workspaceManager
              })
            }]
          }
        ],
        removeWorkspaceMember(globalManagerFromApi.user_id, firstWorkspaceFromApi.workspace_id)
      )

      it('should return a workspace list without the member removed in the right workspace', () => {
        expect(rez).to.deep.equal([
          ...initialState,
          {
            ...serializedFirstWorkspaceFromApi,
            memberList: []
          }
        ])
      })
    })

    describe(`${SET}/${WORKSPACE_MEMBER}`, () => {
      const serializedFirstWorkspace = {
        ...serializedFirstWorkspaceFromApi,
        memberList: []
      }
      const rez = workspaceList(
        [serializedFirstWorkspace],
        setWorkspaceListMemberList([{
          ...serializedFirstWorkspace,
          workspaceId: firstWorkspaceFromApi.workspace_id,
          memberList: [{ user: globalManagerFromApi, do_notify: false, role: ROLE.contributor }]
        }])
      )

      it('should return a workspace list with the memberList correctly added in the right workspace', () => {
        expect(rez).to.deep.equal([
          {
            ...serializedFirstWorkspaceFromApi,
            memberList: [{
              ...serializeMember({
                user: globalManagerFromApi,
                do_notify: false,
                role: ROLE.contributor
              })
            }]
          }
        ])
      })
    })
  })
})
