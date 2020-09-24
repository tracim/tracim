import { FETCH_CONFIG } from './helper.js'

export const putEditContent = (apiUrl, workspaceId, contentId, appSlug, newTitle, newContent, propertiesToAddToBody) => {
  // INFO - CH - 2019-01-03 - Check the -s added to the app slug. This is and should stay consistent with app features
  return fetch(`${apiUrl}/workspaces/${workspaceId}/${appSlug}s/${contentId}`, {
    credentials: 'include',
    headers: { ...FETCH_CONFIG.headers },
    method: 'PUT',
    body: JSON.stringify({
      label: newTitle,
      raw_content: newContent,
      ...propertiesToAddToBody
    })
  })
}

export const postNewComment = (apiUrl, workspaceId, contentId, newComment) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/comments`, {
    credentials: 'include',
    headers: { ...FETCH_CONFIG.headers },
    method: 'POST',
    body: JSON.stringify({
      raw_content: newComment
    })
  })
}

export const getContentComment = (apiUrl, workspaceId, contentId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/comments`, {
    credentials: 'include',
    headers: FETCH_CONFIG.headers,
    method: 'GET'
  })

export const putEditStatus = (apiUrl, workspaceId, contentId, appSlug, newStatus) => {
  // INFO - CH - 2019-01-03 - Check the -s added to the app slug. This is and should stay consistent with app features
  return fetch(`${apiUrl}/workspaces/${workspaceId}/${appSlug}s/${contentId}/status`, {
    credentials: 'include',
    headers: { ...FETCH_CONFIG.headers },
    method: 'PUT',
    body: JSON.stringify({
      status: newStatus
    })
  })
}

export const putContentArchived = (apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/archived`, {
    credentials: 'include',
    headers: { ...FETCH_CONFIG.headers },
    method: 'PUT'
  })
}

export const putContentDeleted = (apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/trashed`, {
    credentials: 'include',
    headers: { ...FETCH_CONFIG.headers },
    method: 'PUT'
  })
}

export const putContentRestoreArchive = (apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/archived/restore`, {
    credentials: 'include',
    headers: { ...FETCH_CONFIG.headers },
    method: 'PUT'
  })
}

export const putContentRestoreDelete = (apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/trashed/restore`, {
    credentials: 'include',
    headers: { ...FETCH_CONFIG.headers },
    method: 'PUT'
  })
}

export const getMyselfKnownMember = (apiUrl, userNameToSearch, workspaceIdToInclude, limit = 0) => {
  const limitParam = limit ? `&limit=${limit}` : ''
  return fetch(`${apiUrl}/users/me/known_members?acp=${userNameToSearch}&include_workspace_ids=${workspaceIdToInclude}${limitParam}`, {
    credentials: 'include',
    headers: FETCH_CONFIG.headers,
    method: 'GET'
  })
}

export const getUsernameAvailability = async (apiUrl, username) => {
  const response = await fetch(`${apiUrl}/system/username-availability?username=${username}`,
    {
      credentials: 'include',
      headers: FETCH_CONFIG.headers,
      method: 'GET'
    }
  )
  return {
    status: response.status,
    json: await response.json()
  }
}

export const getReservedUsernames = async (apiUrl) => {
  const response = await fetch(`${apiUrl}/system/reserved-usernames`,
    {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    }
  )
  return {
    status: response.status,
    json: await response.json()
  }
}
