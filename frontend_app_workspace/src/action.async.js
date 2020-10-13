import { baseFetch } from 'tracim_frontend_lib'

export const postWorkspace = (apiUrl, newWorkspaceName) =>
  baseFetch('POST', `${apiUrl}/workspaces`, {
    label: newWorkspaceName,
    description: '',
    // FIXME 2020-09-15 S.G. - replace these parameters by the one got from the user
    // during https://github.com/tracim/tracim/issues/3577
    access_type: 'confidential',
    default_user_role: 'reader',
    parent_id: null
  })
