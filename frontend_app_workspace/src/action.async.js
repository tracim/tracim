import { FETCH_CONFIG } from 'tracim_frontend_lib'

export const postWorkspace = (apiUrl, newWorkspaceName) =>
  fetch(`${apiUrl}/workspaces`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      label: newWorkspaceName,
      description: '',
      // FIXME 2020-09-15 S.G. - replace this parameter by the one got from the user
      // during https://github.com/tracim/tracim/issues/3577
      access_type: 'confidential'
    })
  })
