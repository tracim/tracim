import {
  SET,
  TOGGLE,
  WORKSPACE,
  WORKSPACE_CONTENT,
  FOLDER,
  WORKSPACE_CONTENT_ARCHIVED,
  WORKSPACE_CONTENT_DELETED
} from '../action-creator.sync.js'

const serializeContent = c => ({
  id: c.content_id,
  label: c.label,
  slug: c.slug,
  type: c.content_type,
  idWorkspace: c.workspace_id,
  isArchived: c.is_archived,
  idParent: c.parent_id,
  isDeleted: c.is_deleted,
  showInUi: c.show_in_ui,
  statusSlug: c.status,
  subContentTypeSlug: c.sub_content_type_slug,
  isOpen: c.isOpen ? c.isOpen : false // only useful for folder
})

export default function workspaceContentList (state = [], action) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_CONTENT}`:
      return action.workspaceContentList.map(c => ({
        ...serializeContent(c),
        isOpen: action.idFolderToOpenList.includes(c.content_id)
      }))

    case `${TOGGLE}/${WORKSPACE}/${FOLDER}`:
      return state.map(c => c.id === action.idFolder ? {...c, isOpen: !c.isOpen} : c)

    case `${SET}/${WORKSPACE_CONTENT_ARCHIVED}`:
      return state.map(wsc => wsc.idWorkspace === action.idWorkspace && wsc.id === action.idContent
        ? {...wsc, isArchived: true}
        : wsc
      )

    case `${SET}/${WORKSPACE_CONTENT_DELETED}`:
      return state.map(wsc => wsc.idWorkspace === action.idWorkspace && wsc.id === action.idContent
        ? {...wsc, isDeleted: true}
        : wsc
      )

    default:
      return state
  }
}
