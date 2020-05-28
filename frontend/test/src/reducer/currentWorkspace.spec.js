import { expect } from 'chai'
import currentWorkspace, {
  serializeMember,
  serializeSidebarEntry,
  serializeWorkspace
} from '../../../src/reducer/currentWorkspace.js'
import {
  ADD,
  addWorkspaceContentList,
  addWorkspaceMember,
  APPEND,
  appendWorkspaceRecentActivityList,
  deleteWorkspaceContentList,
  FOLDER_READ,
  REMOVE,
  removeWorkspaceMember,
  SET,
  setWorkspaceAgendaUrl,
  setWorkspaceContentRead,
  setWorkspaceDetail,
  setWorkspaceMemberList,
  setWorkspaceReadStatusList,
  setWorkspaceRecentActivityList,
  UPDATE,
  updateUserWorkspaceSubscriptionNotif,
  updateWorkspaceContentList,
  updateWorkspaceMember,
  USER_WORKSPACE_DO_NOTIFY,
  WORKSPACE_AGENDA_URL,
  WORKSPACE_CONTENT,
  WORKSPACE_DETAIL,
  WORKSPACE_MEMBER,
  WORKSPACE_MEMBER_LIST,
  WORKSPACE_READ_STATUS_LIST,
  WORKSPACE_RECENT_ACTIVITY_LIST
} from '../../../src/action-creator.sync.js'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace.js'
import { appListAsSidebarEntry } from '../../hocMock/redux/appList/appListAsSidebarEntry.js'
import { globalManagerAsMember, globalManagerAsMemberFromApi } from '../../fixture/user/globalManagerAsMember.js'
import { ROLE } from 'tracim_frontend_lib'
import { globalManagerFromApi } from '../../fixture/user/globalManagerFromApi.js'
import { contentFromApi } from '../../fixture/content/content.js'
import { serializeContent } from '../../../src/reducer/workspaceContentList.js'

describe('reducer currentWorkspace.js', () => {
  describe('serializers', () => {
    describe('serializeWorkspace()', () => {
      const rez = serializeWorkspace(firstWorkspaceFromApi)
      it('should return an object (in camelCase)', () => {
        expect(rez).to.deep.equal({
          id: firstWorkspaceFromApi.workspace_id,
          slug: firstWorkspaceFromApi.slug,
          label: firstWorkspaceFromApi.label,
          description: firstWorkspaceFromApi.description,
          agendaEnabled: firstWorkspaceFromApi.agenda_enabled,
          downloadEnabled: firstWorkspaceFromApi.public_download_enabled,
          uploadEnabled: firstWorkspaceFromApi.public_upload_enabled
        })
      })
    })

    describe('serializeSidebarEntry()', () => {
      const rez = serializeSidebarEntry(appListAsSidebarEntry)
      it('should return an object (in camelCase)', () => {
        expect(rez).to.deep.equal({
          slug: appListAsSidebarEntry.slug,
          route: appListAsSidebarEntry.route,
          faIcon: appListAsSidebarEntry.fa_icon,
          hexcolor: appListAsSidebarEntry.hexcolor,
          label: appListAsSidebarEntry.label
        })
      })
    })

    describe('serializeMember()', () => {
      const rez = serializeMember(globalManagerAsMemberFromApi)
      it('should return an object (in camelCase)', () => {
        expect(rez).to.deep.equal({
          id: globalManagerAsMemberFromApi.user.user_id,
          publicName: globalManagerAsMemberFromApi.user.public_name,
          role: globalManagerAsMemberFromApi.role,
          doNotify: globalManagerAsMemberFromApi.do_notify
        })
      })
    })
  })

  describe('actions', () => {
    const initialState = { id: 42, dummyProperty: 'nothing' }

    it('should return the initial state when no action given', () => {
      const rez = currentWorkspace(initialState, { type: 'nothing that will match', action: {} })
      expect(rez).to.deep.equal({ ...initialState })
    })

    describe(`${SET}/${WORKSPACE_DETAIL}`, () => {
      const rez = currentWorkspace(initialState, setWorkspaceDetail(firstWorkspaceFromApi))

      it('should return a workspace object', () => {
        expect(rez).to.deep.equal({
          ...initialState,
          ...serializeWorkspace(firstWorkspaceFromApi),
          sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(sbe => serializeSidebarEntry(sbe))
        })
      })
    })

    describe(`${SET}/${WORKSPACE_MEMBER_LIST}`, () => {
      const rez = currentWorkspace(initialState, setWorkspaceMemberList([globalManagerAsMemberFromApi]))

      it('should return a workspace object with a proper members list', () => {
        expect(rez).to.deep.equal({
          ...initialState,
          memberList: [serializeMember(globalManagerAsMemberFromApi)]
        })
      })
    })

    describe(`${ADD}/${WORKSPACE_MEMBER}`, () => {
      const randomMember = {
        id: 15,
        publicName: 'random user',
        role: ROLE.reader.slug,
        doNotify: true
      }
      const initialStateWithMember = { ...initialState, memberList: [randomMember] }
      const rez = currentWorkspace(
        initialStateWithMember,
        addWorkspaceMember(globalManagerFromApi, {}, { role: ROLE.workspaceManager.slug, do_notify: true })
      )

      it('should return a workspace object with the new member', () => {
        expect(rez).to.deep.equal({
          ...initialState,
          memberList: [
            randomMember,
            serializeMember(globalManagerAsMemberFromApi)
          ]
        })
      })
    })

    describe(`${UPDATE}/${WORKSPACE_MEMBER}`, () => {
      const initialStateWithMember = { ...initialState, memberList: [globalManagerAsMember] }
      const rez = currentWorkspace(
        initialStateWithMember,
        updateWorkspaceMember(globalManagerFromApi, {}, { role: ROLE.contributor.slug, do_notify: true })
      )
      it('should return a workspace object with the member global manager as contributor', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithMember,
          memberList: [{
            ...globalManagerAsMember,
            role: ROLE.contributor.slug
          }]
        })
      })
    })

    describe(`${REMOVE}/${WORKSPACE_MEMBER}`, () => {
      const initialStateWithMember = { ...initialState, memberList: [globalManagerAsMember] }
      const rez = currentWorkspace(
        initialStateWithMember,
        removeWorkspaceMember(globalManagerAsMember.id, {})
      )
      it('should return a workspace object with an empty member list', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithMember,
          memberList: []
        })
      })
    })

    describe(`${UPDATE}/${USER_WORKSPACE_DO_NOTIFY}`, () => {
      const initialStateWithMember = { ...initialState, memberList: [{ ...globalManagerAsMember, doNotify: true }] }
      const rez = currentWorkspace(
        initialStateWithMember,
        updateUserWorkspaceSubscriptionNotif(globalManagerAsMember.id, initialState.id, false)
      )
      it('should return a workspace object with the member as notification disabled', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithMember,
          memberList: [{
            ...globalManagerAsMember,
            doNotify: false
          }]
        })
      })
    })

    describe(`${SET}/${WORKSPACE_RECENT_ACTIVITY_LIST}`, () => {
      const initialStateWithRecentActivity = {
        ...initialState,
        recentActivityList: [{ id: 42, dummyProperty: 'nothing' }]
      }
      const rez = currentWorkspace(initialStateWithRecentActivity, setWorkspaceRecentActivityList([contentFromApi]))
      it('should return a workspace object with a recent activity list with only the added content', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithRecentActivity,
          recentActivityList: [serializeContent(contentFromApi)]
        })
      })
    })

    describe(`${APPEND}/${WORKSPACE_RECENT_ACTIVITY_LIST}`, () => {
      const initialStateWithRecentActivity = {
        ...initialState,
        recentActivityList: [
          serializeContent({ ...contentFromApi, content_id: 42, label: 'content for test' })
        ]
      }
      const rez = currentWorkspace(initialStateWithRecentActivity, appendWorkspaceRecentActivityList([contentFromApi]))
      it('should return a workspace object with a recent activity list with the added content at the end', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithRecentActivity,
          recentActivityList: [
            ...initialStateWithRecentActivity.recentActivityList,
            serializeContent(contentFromApi)
          ]
        })
      })
    })

    describe(`${ADD}/${WORKSPACE_CONTENT}`, () => {
      const initialStateWithRecentActivity = {
        ...initialState,
        recentActivityList: [
          serializeContent({ ...contentFromApi, content_id: 42, label: 'content for test' })
        ]
      }
      const rez = currentWorkspace(initialStateWithRecentActivity, addWorkspaceContentList([contentFromApi]))
      it('should return a workspace object with a recent activity list with the added content at the beginning', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithRecentActivity,
          recentActivityList: [
            serializeContent(contentFromApi),
            ...initialStateWithRecentActivity.recentActivityList
          ]
        })
      })
    })

    describe(`${UPDATE}/${WORKSPACE_CONTENT}`, () => {
      const initialStateWithRecentActivity = {
        ...initialState,
        recentActivityList: [
          serializeContent({ ...contentFromApi, label: 'content for test' })
        ],
        contentReadStatusList: [1, 2, contentFromApi.content_id]
      }
      const rez = currentWorkspace(initialStateWithRecentActivity, updateWorkspaceContentList([contentFromApi]))
      it('should return a workspace object with a recent activity list with only one element updated', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithRecentActivity,
          recentActivityList: [
            serializeContent(contentFromApi)
          ],
          contentReadStatusList: [1, 2]
        })
      })
    })

    describe(`${REMOVE}/${WORKSPACE_CONTENT}`, () => {
      const initialStateWithRecentActivity = {
        ...initialState,
        recentActivityList: [
          serializeContent(contentFromApi)
        ]
      }
      const rez = currentWorkspace(
        initialStateWithRecentActivity,
        deleteWorkspaceContentList([serializeContent(contentFromApi)])
      )
      it('should return a workspace object with an empty recent activity list', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithRecentActivity,
          recentActivityList: []
        })
      })
    })

    describe(`${SET}/${WORKSPACE_READ_STATUS_LIST}`, () => {
      const initialStateWithReadStatusList = {
        ...initialState,
        contentReadStatusList: [100, 101]
      }
      const readStatusListFromApi = [
        { content_id: 1, read_by_user: true },
        { content_id: 2, read_by_user: false },
        { content_id: 3, read_by_user: true }
      ]
      const rez = currentWorkspace(initialStateWithReadStatusList, setWorkspaceReadStatusList(readStatusListFromApi))
      it('should return a workspace object with a read status list containing only the ids with read_by_user at true', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithReadStatusList,
          contentReadStatusList: [1, 3]
        })
      })
    })

    describe(`${SET}/${FOLDER_READ}`, () => {
      const initialStateWithReadStatusList = {
        ...initialState,
        contentReadStatusList: [100, 101]
      }
      const rez = currentWorkspace(initialStateWithReadStatusList, setWorkspaceContentRead(42))
      it('should return a workspace object with a read status list containing all the previous ids and the new one', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithReadStatusList,
          contentReadStatusList: [100, 101, 42]
        })
      })
    })

    describe(`${SET}/${WORKSPACE_AGENDA_URL}`, () => {
      const initialStateWithAgendaUrl = {
        ...initialState,
        agendaUrl: ''
      }
      const newAgendaUrl = '/agenda/new/url'
      const rez = currentWorkspace(initialStateWithAgendaUrl, setWorkspaceAgendaUrl(newAgendaUrl))
      it('should return a workspace object with the new agenda url', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithAgendaUrl,
          agendaUrl: newAgendaUrl
        })
      })
    })
  })
})
