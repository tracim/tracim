const PAGES = {
  CONTENTS: 'contents',
  DASHBOARD: 'dashboard'
}

const reverseUrl = (pageName, extra={}) => {
  switch  (pageName) {
    case PAGES.CONTENTS:
      if (extra.type) {
          return ({workspaceId}) => `/ui/workspaces/${workspaceId}/contents?type=${extra.type}`
      }
      return ({workspaceId}) => `/ui/workspaces/${workspaceId}/contents`
    case PAGES.DASHBOARD:
      return ({workspaceId}) => `/ui/workspaces/${workspaceId}/dashboard`
    default:
      throw `No page found for page name ${pageName} and extra args ${extra}`
  }
}

const formatUrl = ({pageName, extra, param = {},}) => {
  return reverseUrl(pageName, extra)(param)
}
export { PAGES, reverseUrl, formatUrl }

/*
EXEMPLE
formatUrl(pageName: PAGES.CONTENTS, extra: {type: FILE}, param: {workspaceId: 1}})
> '/ui/workspaces/1/contents?type=file'
----

const lazyContentUrl = reverseUrl(PAGES.CONTENTS)
const workspace1 = lazyContentUrl(workspaceId: 1)
const workspace2 = lazyContentUrl(workspaceId: 2)
*/
