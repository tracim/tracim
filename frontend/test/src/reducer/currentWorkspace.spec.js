import { expect } from 'chai'
import currentWorkspace, {
  serializeMember,
  serializeSidebarEntryProps,
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
  removeWorkspaceReadStatus,
  SET,
  setWorkspaceAgendaUrl,
  setWorkspaceContentRead,
  setWorkspaceDetail,
  setWorkspaceMemberList,
  setWorkspaceReadStatusList,
  setWorkspaceRecentActivityList,
  UPDATE,
  updateUser,
  updateUserWorkspaceSubscriptionNotif,
  updateWorkspaceContentList,
  updateWorkspaceDetail,
  updateWorkspaceMember,
  addWorkspaceReadStatus,
  USER,
  USER_WORKSPACE_DO_NOTIFY,
  WORKSPACE_AGENDA_URL,
  WORKSPACE_CONTENT,
  WORKSPACE_DETAIL,
  WORKSPACE_MEMBER,
  WORKSPACE_MEMBER_LIST,
  WORKSPACE_READ_STATUS,
  WORKSPACE_READ_STATUS_LIST,
  WORKSPACE_RECENT_ACTIVITY_LIST,
  WORKSPACE_CONTENT_SHARE_FOLDER
} from '../../../src/action-creator.sync.js'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace.js'
import { globalManagerAsMember, globalManagerAsMemberFromApi } from '../../fixture/user/globalManagerAsMember.js'
import { ROLE, serialize } from 'tracim_frontend_lib'
import { globalManagerFromApi } from '../../fixture/user/globalManagerFromApi.js'
import { contentFromApi } from '../../fixture/content/content.js'
import { CONTENT_NAMESPACE } from '../../../src/util/helper'
import { serializeContentProps } from '../../../src/reducer/workspaceContentList'

describe('reducer currentWorkspace.js', () => {
  describe('serializers', () => {
    describe('serializeWorkspace()', () => {
      const rez = serializeWorkspace(firstWorkspaceFromApi)
      it('should return an object (in camelCase)', () => {
        expect(rez).to.deep.equal({
          accessType: firstWorkspaceFromApi.access_type,
          defaultRole: firstWorkspaceFromApi.default_user_role,
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

    describe('serializeMember()', () => {
      const rez = serializeMember(globalManagerAsMemberFromApi)
      it('should return an object (in camelCase)', () => {
        expect(rez).to.deep.equal({
          id: globalManagerAsMemberFromApi.user.user_id,
          publicName: globalManagerAsMemberFromApi.user.public_name,
          role: globalManagerAsMemberFromApi.role,
          doNotify: globalManagerAsMemberFromApi.do_notify,
          username: globalManagerAsMemberFromApi.user.username,
          hasAvatar: false,
          hasCover: false
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
          sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps))
        })
      })
    })

    describe(`${UPDATE}/${WORKSPACE_DETAIL}`, () => {
      const newLabel = 'label after edition'
      const firstWorkspaceFromApiWithEditedLabel = {
        ...firstWorkspaceFromApi,
        workspace_id: initialState.id,
        label: newLabel
      }
      const rez = currentWorkspace(initialState, updateWorkspaceDetail(firstWorkspaceFromApiWithEditedLabel))

      it('should return a workspace object with the edited label', () => {
        expect(rez).to.deep.equal({
          ...initialState,
          ...serializeWorkspace(firstWorkspaceFromApiWithEditedLabel),
          label: newLabel,
          sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps))
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
        doNotify: true,
        username: 'random'
      }
      const initialStateWithMember = { ...initialState, memberList: [randomMember] }
      const rez = currentWorkspace(
        initialStateWithMember,
        addWorkspaceMember(globalManagerFromApi, initialState.id, { role: ROLE.workspaceManager.slug, do_notify: true })
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
        updateWorkspaceMember(globalManagerFromApi, initialState.id, { role: ROLE.contributor.slug, do_notify: true })
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
        removeWorkspaceMember(globalManagerAsMember.id, initialState.id)
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
          recentActivityList: [serialize(contentFromApi, serializeContentProps)]
        })
      })
    })

    describe(`${APPEND}/${WORKSPACE_RECENT_ACTIVITY_LIST}`, () => {
      const initialStateWithRecentActivity = {
        ...initialState,
        recentActivityList: [
          serialize({ ...contentFromApi, content_id: 42, label: 'content for test' }, serializeContentProps)
        ]
      }
      const rez = currentWorkspace(initialStateWithRecentActivity, appendWorkspaceRecentActivityList([contentFromApi]))
      it('should return a workspace object with a recent activity list with the added content at the end', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithRecentActivity,
          recentActivityList: [
            ...initialStateWithRecentActivity.recentActivityList,
            serialize(contentFromApi, serializeContentProps)
          ]
        })
      })
    })

    describe(`${ADD}/${WORKSPACE_CONTENT}`, () => {
      const initialStateWithRecentActivity = {
        ...initialState,
        recentActivityList: [
          serialize({ ...contentFromApi, content_id: 42, label: 'content for test' }, serializeContentProps)
        ]
      }
      const rez = currentWorkspace(initialStateWithRecentActivity, addWorkspaceContentList([contentFromApi], initialState.id))
      it('should return a workspace object with a recent activity list with the added content at the beginning', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithRecentActivity,
          recentActivityList: [
            serialize(contentFromApi, serializeContentProps),
            ...initialStateWithRecentActivity.recentActivityList
          ]
        })
      })
    })

    describe(`${UPDATE}/${WORKSPACE_CONTENT}`, () => {
      const initialStateWithRecentActivity = {
        ...initialState,
        recentActivityList: [
          serialize({ ...contentFromApi, label: 'content for test' }, serializeContentProps)
        ],
        contentReadStatusList: [1, 2, contentFromApi.content_id]
      }
      const rez = currentWorkspace(initialStateWithRecentActivity, updateWorkspaceContentList([contentFromApi], initialState.id))
      it('should return a workspace object with a recent activity list with only one element updated', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithRecentActivity,
          recentActivityList: [
            serialize(contentFromApi, serializeContentProps)
          ],
          contentReadStatusList: [1, 2]
        })
      })
      describe('move a content in a new workspace', () => {
        const rez = currentWorkspace(initialStateWithRecentActivity, updateWorkspaceContentList([contentFromApi], initialState.id + 1))
        it('should return a workspace object with an empty recent activity list', () => {
          expect(rez).to.deep.equal({
            ...initialStateWithRecentActivity,
            recentActivityList: [],
            contentReadStatusList: [1, 2]
          })
        })
      })
    })

    describe(`${REMOVE}/${WORKSPACE_CONTENT}`, () => {
      const initialStateWithRecentActivity = {
        ...initialState,
        recentActivityList: [
          serialize(contentFromApi, serializeContentProps)
        ]
      }
      const rez = currentWorkspace(
        initialStateWithRecentActivity,
        deleteWorkspaceContentList([contentFromApi], initialState.id)
      )
      it('should return a workspace object with an empty recent activity list', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithRecentActivity,
          recentActivityList: []
        })
      })
    })

    describe(`${ADD}/${WORKSPACE_CONTENT_SHARE_FOLDER}`, () => {
      const contentShareFolder = { ...contentFromApi, content_namespace: CONTENT_NAMESPACE.UPLOAD }

      const initialStateWithRecentActivity = {
        ...initialState,
        recentActivityList: [
          serialize({ ...contentShareFolder, content_id: 42, label: 'content for test' }, serializeContentProps)
        ]
      }
      const rez = currentWorkspace(initialStateWithRecentActivity, addWorkspaceContentList([contentShareFolder], initialState.id))
      it('should return a workspace object with a recent activity list with the added content at the beginning', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithRecentActivity,
          recentActivityList: [
            serialize(contentShareFolder, serializeContentProps),
            ...initialStateWithRecentActivity.recentActivityList
          ]
        })
      })
    })

    describe(`${UPDATE}/${WORKSPACE_CONTENT_SHARE_FOLDER}`, () => {
      const contentShareFolder = { ...contentFromApi, content_namespace: CONTENT_NAMESPACE.UPLOAD }

      const initialStateWithRecentActivity = {
        ...initialState,
        recentActivityList: [
          serialize({ ...contentShareFolder, label: 'content for test' }, serializeContentProps)
        ],
        contentReadStatusList: [1, 2, contentShareFolder.content_id]
      }
      const rez = currentWorkspace(initialStateWithRecentActivity, updateWorkspaceContentList([contentShareFolder], initialState.id))
      it('should return a workspace object with a recent activity list with only one element updated', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithRecentActivity,
          recentActivityList: [
            serialize(contentShareFolder, serializeContentProps)
          ],
          contentReadStatusList: [1, 2]
        })
      })
    })

    describe(`${REMOVE}/${WORKSPACE_CONTENT_SHARE_FOLDER}`, () => {
      const contentShareFolder = { ...contentFromApi, content_namespace: CONTENT_NAMESPACE.UPLOAD }

      const initialStateWithRecentActivity = {
        ...initialState,
        recentActivityList: [
          serialize({ ...contentShareFolder, content_namespace: CONTENT_NAMESPACE.UPLOAD }, serializeContentProps)
        ]
      }
      const rez = currentWorkspace(
        initialStateWithRecentActivity,
        deleteWorkspaceContentList([{ ...contentShareFolder, content_namespace: CONTENT_NAMESPACE.UPLOAD }], initialState.id)
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

    describe(`${ADD}/${WORKSPACE_READ_STATUS_LIST}`, () => {
      const initialStateWithReadStatusList = {
        ...initialState,
        contentReadStatusList: [100, 101]
      }
      const rez = currentWorkspace(initialStateWithReadStatusList, addWorkspaceReadStatus({ content_id: 2 }, initialState.id))
      it('should return a workspace object with the contentReadStatusList correctly updated', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithReadStatusList,
          contentReadStatusList: [100, 101, 2]
        })
      })
    })

    describe(`${REMOVE}/${WORKSPACE_READ_STATUS}`, () => {
      const initialStateWithReadStatusList = {
        ...initialState,
        contentReadStatusList: [100, 101, contentFromApi.content_id],
        recentActivityList: [serialize(contentFromApi, serializeContentProps)]
      }
      const rez = currentWorkspace(initialStateWithReadStatusList, removeWorkspaceReadStatus(contentFromApi, initialState.id))
      it('should return a workspace with a read status list not containing the content id that we removed', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithReadStatusList,
          contentReadStatusList: [100, 101],
          recentActivityList: [serialize(contentFromApi, serializeContentProps)]
        })
      })

      describe('with the unread content at the last position in recentActivityList', () => {
        const anotherContent = {
          ...contentFromApi,
          content_id: 51
        }
        const anotherContent2 = {
          ...contentFromApi,
          content_id: 73
        }
        const initialStateWithReadStatusList2 = {
          ...initialStateWithReadStatusList,
          recentActivityList: [
            serialize(contentFromApi, serializeContentProps),
            serialize(anotherContent, serializeContentProps),
            serialize(anotherContent2, serializeContentProps)
          ]
        }
        const rez = currentWorkspace(initialStateWithReadStatusList2, removeWorkspaceReadStatus(anotherContent2, initialState.id))
        it('should put the unread content at the first position in recentActivityList', () => {
          expect(rez).to.deep.equal({
            ...initialStateWithReadStatusList2,
            recentActivityList: [
              serialize(anotherContent2, serializeContentProps),
              serialize(contentFromApi, serializeContentProps),
              serialize(anotherContent, serializeContentProps)
            ]
          })
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

    describe(`${UPDATE}/${USER}`, () => {
      const newInitialState = {
        ...initialState,
        memberList: [{
          ...serializeMember(globalManagerAsMemberFromApi),
          doNotify: false
        }]
      }
      const rez = currentWorkspace(newInitialState, updateUser({ ...globalManagerFromApi, username: 'newUsername' }))
      it('should return a workspace object with the new user inside memberList', () => {
        expect(rez).to.deep.equal({
          ...newInitialState,
          memberList: [{
            ...globalManagerAsMember,
            doNotify: false,
            username: 'newUsername'
          }]
        })
      })
    })
  })
})
