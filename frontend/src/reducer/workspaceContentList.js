import {
  SET,
  UPDATE,
  TOGGLE,
  WORKSPACE,
  WORKSPACE_CONTENT,
  WORKSPACE_CONTENT_PATH,
  FOLDER,
  WORKSPACE_CONTENT_ARCHIVED,
  WORKSPACE_CONTENT_DELETED
} from '../action-creator.sync.js'
import uniq from 'lodash/uniq'
import uniqBy from 'lodash/uniqBy'

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
      return action.workspaceContentList.map(c => serializeContent(c))

    case `${SET}/${WORKSPACE_CONTENT_PATH}`:
      const openedIdFolderList = state.filter(c => c.isOpen).map(c => c.id) // already opened folder
      const folderPathList = action.contentPath.map(c => c.parent_id) // folder to open because in path
      const mergedOpenedFolderList = uniq([...openedIdFolderList, ...folderPathList])
      return [
        ...action.contentList.map(c => ({...serializeContent(c), isOpen: mergedOpenedFolderList.includes(c.content_id)})),
        ...action.contentPath.map(c => ({...serializeContent(c), isOpen: c.type === 'folder'}))
      ]

    case `${UPDATE}/${WORKSPACE}/Filter`: // not used anymore ?
      return {...state, filter: action.filterList}

    case `${SET}/${WORKSPACE}/${FOLDER}/Content`:
      const listFolder = action.content.map(c => c.parent_id)

      const mergedArray = [ // cast back from Set into array
        ...state.map(c => c.type === 'folder'
          ? {...c, isOpen: c.isOpen || listFolder.includes(c.id)} // auto opens folder in path
          : c
        ),
        ...action.content.map(c => serializeContent(c))
      ]

      return uniqBy(mergedArray, n => n.id)

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
