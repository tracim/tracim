import {
  CONTENT_TYPE,
  ROLE_LIST
} from './helper.js'

// INFO - 2024-05-20 - Improvement idea:
// param appContentType might not be mandatory and be deduced from content.content_type
// param appLanguage might not be mandatory and be deduced from loggedUser.lang
// Improvement not done yet to ensure compatibility for frontend/ and apps
export const buildAppCustomActionLinkList = (
  appCustomActionConfig, content, loggedUser, appContentType, appLanguage
) => {
  // INFO - CH - 2024-05-17 - The function can be called before api has returned content data.
  if (!content.content_id && !content.id) return []

  const contentSafe = { ...content }
  // INFO - CH - 2024-05-16 - Due to a design flaw, content and user objects keys are in camelCase in frontend/
  // and in snake_case in apps. So, functions that might be executed in frontend/ and in apps might have
  // issues managing both notation types
  if (
    content.content_id === undefined ||
    content.workspace_id === undefined ||
    content.file_extension === undefined
  ) {
    contentSafe.content_id = content.id
    contentSafe.workspace_id = content.workspaceId
    contentSafe.file_extension = content.fileExtension
  }
  return appCustomActionConfig
    .filter(ca => filterUserRole(ca, loggedUser.userRoleIdInWorkspace))
    .filter(ca => filterUserProfile(ca, loggedUser.profile))
    .filter(ca => filterContentType(ca, appContentType))
    .filter(ca => filterContentExtension(ca, contentSafe, appContentType))
    .filter(ca => filterContentLabelRegex(ca, contentSafe))
    .filter(ca => filterWorkspaceId(ca, contentSafe))
    .map(ca => {
      return {
        icon: ca.icon_text,
        image: ca.icon_image,
        label: ca.label[appLanguage],
        actionLink: replaceCustomActionLinkVariable(ca, contentSafe, loggedUser),
        // INFO - CH - 20240515 - we filter the custom actions that should not be displayed so we can always
        // set showAction to true
        showAction: true,
        dataCy: 'popinListItem__customAction'
      }
    })
}

const replaceCustomActionLinkVariable = (customAction, content, user) => {
  return customAction.link
    .replace('{content.label}', encodeURIComponent(content.label))
    .replace('{content.content_id}', content.content_id)
    .replace('{content.workspace_id}', content.workspace_id)
    .replace('{content.author_id}', content.author?.user_id || '')
    .replace('{content.author_name}', encodeURIComponent(content.author?.public_name || ''))
    .replace('{content.url}', encodeURIComponent(`${window.location.origin}/contents/${content.content_id}`))
    .replace('{user.user_id}', user.userId)
}

const filterContentType = (customAction, appContentType) => {
  try {
    if (!customAction.content_type_filter) return true
    return customAction.content_type_filter.toLowerCase().split(',').includes(appContentType)
  } catch (e) {
    console.error('Error in filterContentType during buildAppCustomActionLinkList', e, customAction, appContentType)
    return false
  }
}

const filterContentExtension = (customAction, content, appContentType) => {
  try {
    if (appContentType !== CONTENT_TYPE.FILE) return true

    if (!customAction.content_extension_filter) return true
    return customAction.content_extension_filter.toLowerCase().split(',').includes(content.file_extension)
  } catch (e) {
    console.error(
      'Error in filterContentExtension during buildAppCustomActionLinkList', e, customAction, content, appContentType
    )
    return false
  }
}

const filterContentLabelRegex = (customAction, content) => {
  try {
    if (!customAction.content_label_filter) return true
    const regex = new RegExp(customAction.content_label_filter, 'gi')
    return regex.test(content.label)
  } catch (e) {
    console.error('Error in filterContentLabelRegex during buildAppCustomActionLinkList', e, customAction, content)
    return false
  }
}

const filterWorkspaceId = (customAction, content) => {
  try {
    if (!customAction.workspace_filter) return true
    return customAction.workspace_filter.toLowerCase().split(',').includes(content.workspace_id?.toString())
  } catch (e) {
    console.error('Error in filterWorkspaceId during buildAppCustomActionLinkList', e, customAction, content)
    return false
  }
}

const filterUserRole = (customAction, userRoleIdInWorkspace) => {
  try {
    if (!customAction.user_role_filter) return true
    const userRoleFilterIdList = customAction.user_role_filter
      .toLowerCase()
      .split(',')
      .map(ur => ROLE_LIST.find(r => r.slug === ur).id)
    return userRoleFilterIdList.includes(userRoleIdInWorkspace)
  } catch (e) {
    console.error('Error in filterUserRole during buildAppCustomActionLinkList', e, customAction, userRoleIdInWorkspace)
    return false
  }
}

const filterUserProfile = (customAction, userProfileId) => {
  try {
    if (!customAction.user_profile_filter) return true
    return customAction.user_profile_filter.toLowerCase().split(',').includes(userProfileId)
  } catch (e) {
    console.error('Error in filterUserProfile during buildAppCustomActionLinkList', e, customAction, userProfileId)
    return false
  }
}
