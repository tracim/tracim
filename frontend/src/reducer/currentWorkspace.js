import {
  SET,
  APPEND,
  REMOVE,
  WORKSPACE_DETAIL,
  WORKSPACE_MEMBER_LIST,
  WORKSPACE_READ_STATUS_LIST,
  WORKSPACE_RECENT_ACTIVITY_LIST,
  WORKSPACE_MEMBER
} from '../action-creator.sync.js'
import { handleRouteFromApi } from '../helper.js'
import { generateAvatarFromPublicName } from 'tracim_frontend_lib'

const defaultWorkspace = {
  id: 0,
  slug: '',
  label: '',
  description: '',
  sidebarEntryList: [],
  memberList: [],
  recentActivityList: [],
  recentActivityForUserList: [],
  contentReadStatusList: []
}

export default function currentWorkspace (state = defaultWorkspace, action) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_DETAIL}`:
      return {
        ...state,
        id: action.workspaceDetail.workspace_id,
        slug: action.workspaceDetail.slug,
        label: action.workspaceDetail.label,
        description: action.workspaceDetail.description,
        sidebarEntryList: action.workspaceDetail.sidebar_entries.map(sbe => ({
          slug: sbe.slug,
          route: handleRouteFromApi(sbe.route),
          faIcon: sbe.fa_icon,
          hexcolor: sbe.hexcolor,
          label: sbe.label
        }))
      }

    case `${SET}/${WORKSPACE_MEMBER_LIST}`:
      return {
        ...state,
        memberList: action.workspaceMemberList.map(m => ({
          id: m.user_id,
          publicName: m.user.public_name,
          avatarUrl: m.user.avatar_url
            ? m.user.avatar_url
            : m.user.public_name ? generateAvatarFromPublicName(m.user.public_name) : '',
          role: m.role,
          isActive: m.is_active
        }))
      }

    case `${SET}/${WORKSPACE_RECENT_ACTIVITY_LIST}`:
      return {
        ...state,
        recentActivityList: action.workspaceRecentActivityList.map(ra => ({
          id: ra.content_id,
          slug: ra.slug,
          label: ra.label,
          type: ra.content_type,
          idParent: ra.parent_id,
          showInUi: ra.show_in_ui,
          isArchived: ra.is_archived,
          isDeleted: ra.is_deleted,
          statusSlug: ra.status,
          subContentTypeSlug: ra.sub_content_types
        }))
      }

    case `${APPEND}/${WORKSPACE_RECENT_ACTIVITY_LIST}`:
      return {
        ...state,
        recentActivityList: [
          ...state.recentActivityList,
          ...action.workspaceRecentActivityList.map(ra => ({
            id: ra.content_id,
            slug: ra.slug,
            label: ra.label,
            type: ra.content_type,
            idParent: ra.parent_id,
            showInUi: ra.show_in_ui,
            isArchived: ra.is_archived,
            isDeleted: ra.is_deleted,
            statusSlug: ra.status,
            subContentTypeSlug: ra.sub_content_types
          }))
        ]
      }

    case `${SET}/${WORKSPACE_READ_STATUS_LIST}`:
      return {
        ...state,
        contentReadStatusList: action.workspaceReadStatusList
          .filter(content => content.read_by_user)
          .map(content => content.content_id)
      }

    case `${REMOVE}/${WORKSPACE_MEMBER}`:
      return {
        ...state,
        memberList: state.memberList.filter(m => m.id !== action.idMember)
      }

    default:
      return state
  }
}
