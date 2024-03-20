import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import classnames from 'classnames'
import { DragSource, DropTarget } from 'react-dnd'
import BtnExtandedAction from './BtnExtandedAction.jsx'
import ContentItem from './ContentItem.jsx'
import {
  DropdownMenu,
  Icon,
  PAGE,
  sortWithFoldersAtListBeginning,
  ROLE,
  sortListBy,
  TimedEvent,
  getRevisionTypeLabel
} from 'tracim_frontend_lib'
import {
  DRAG_AND_DROP,
  SHARE_FOLDER_ID,
  ANCHOR_NAMESPACE
} from '../../util/helper.js'
import { HACK_COLLABORA_CONTENT_TYPE } from '../../container/WorkspaceContent.jsx'

require('./Folder.styl')

class Folder extends React.Component {
  calculateIcon = () => {
    const { props } = this

    const isDropActive = props.canDrop && props.isOver
    const isHoveringSelf = props.draggedItem && props.draggedItem.contentId === props.folderData.id

    if (!isDropActive || isHoveringSelf) {
      if (props.folderData.isOpen) return 'far fa-folder-open'
      return 'far fa-folder'
    }

    if (props.folderData.parentId === SHARE_FOLDER_ID) return 'fas fa-times-circle primaryColorFont'

    const isHoveringSelfParent = props.draggedItem && props.draggedItem.parentId === props.folderData.id
    if (isHoveringSelfParent) return 'fas fa-times-circle primaryColorFont'

    const parentIdList = props.getContentParentList(props.folderData, props.workspaceContentList)
    const isHoveringChildrenFolder = parentIdList.includes(props.draggedItem.contentId)
    if (isHoveringChildrenFolder) return 'fas fa-times-circle primaryColorFont'

    return 'fas fa-arrow-circle-down primaryColorFont'
  }

  render () {
    const { props } = this

    const folderContentList = props.workspaceContentList.filter(c => c.parentId === props.folderData.id)

    const folderAvailableApp = props.availableApp
      .filter(a =>
        props.folderData.subContentTypeList.includes(a.slug) ||
        // FIXME - CH - 2019-09-06 - hack for content type. See https://github.com/tracim/tracim/issues/2375
        // second part of the "&&" is to hide collaborative document if content type file is not available
        (a.slug === HACK_COLLABORA_CONTENT_TYPE(props.contentType).slug && props.folderData.subContentTypeList.includes('file'))
      )

    const isActive = props.folderData.isOpen && folderContentList.length > 0

    return (
      <div
        className={classnames('folder', {
          active: isActive,
          'item-last': props.isLast,
          read: true // props.readStatusList.includes(props.folderData.id) // Côme - 2018/11/27 - need to decide what we do for folder read status. See tracim/tracim #1189
        })}
        data-cy={`folder_${props.folderData.id}`}
        id={`${ANCHOR_NAMESPACE.workspaceItem}:${props.folderData.id}`}
      >
        <div
          // Côme - 2018/11/06 - the .primaryColorBorderLightenHover is used by folder__header__triangleborder and folder__header__triangleborder__triangle
          // since they have the border-top-color: inherit on hover
          onClick={(e) => props.onClickFolder(e, props.folderData.id)}
          title={props.folderData.label}
          ref={props.userRoleIdInWorkspace >= ROLE.contentManager.id ? props.connectDropTarget : undefined}
        >
          <div
            className='folder__header align-items-center'
            ref={props.userRoleIdInWorkspace >= ROLE.contentManager.id ? props.connectDragPreview : undefined}
          >

            <div className={classnames('folder__header__triangleborder', { open: isActive })}>
              <div className='folder__header__triangleborder__triangle primaryColorFontLighten' />
            </div>
            <div
              className='folder__header__dragPreview'
              ref={props.userRoleIdInWorkspace >= ROLE.contentManager.id ? props.connectDragSource : undefined}
            >
              <div
                className='folder__header__icon'
                title={props.t('Folder')}
                style={{ color: props.contentType.find(c => c.slug === 'folder').hexcolor }}
              >
                <i className={props.isDragging ? 'fas fa-arrows-alt' : classnames('fa-fw', this.calculateIcon())} />
              </div>

              <div className='folder__header__name'>
                <span>{props.folderData.label}</span>
                {props.loading && <>&nbsp;<Icon icon='fas fa-spin fa-spinner' title={props.t('Loading…')} /></>}
              </div>
            </div>

            <TimedEvent
              customClass='folder__header__lastModification'
              operation={getRevisionTypeLabel(props.folderData.currentRevisionType, props.t)}
              date={props.folderData.modified}
              lang={props.lang}
              author={{
                publicName: props.folderData.lastModifier.public_name,
                userId: props.folderData.lastModifier.user_id
              }}
            />

            <div className='folder__header__button'>
              <div className='folder__header__button__addbtn'>
                {props.userRoleIdInWorkspace >= ROLE.contributor.id && props.showCreateContentButton && folderAvailableApp.length > 0 && (
                  <DropdownMenu
                    buttonIcon='fas fa-plus'
                    buttonTooltip={props.t('Create in folder')}
                    buttonCustomClass='folder__header__button__addbtn__text primaryColorBgHover'
                    isButton
                  >
                    {folderAvailableApp.map(app =>
                      <button
                        className='transparentButton'
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          props.onClickCreateContent(e, props.folderData.id, app.slug)
                        }}
                        key={`${props.folderData.id}__${app.slug}`}
                      >
                        <i
                          className={`fa-fw ${app.faIcon}`}
                          style={{ color: app.hexcolor }}
                        />
                        {props.t(app.creationLabel)}
                      </button>
                    )}
                  </DropdownMenu>
                )}

                <div className='d-none d-md-flex' title={props.t('Actions')}>
                  <BtnExtandedAction
                    userRoleIdInWorkspace={props.userRoleIdInWorkspace}
                    onClickExtendedAction={{
                      edit: {
                        callback: e => props.onClickExtendedAction.edit(e, props.folderData),
                        label: props.t('Edit'),
                        allowedRoleId: ROLE.contentManager.id
                      },
                      download: {
                        callback: e => props.onClickExtendedAction.download(e, props.folderData),
                        label: props.t('Download'),
                        allowedRoleId: ROLE.reader.id
                      },
                      archive: {
                        callback: e => props.onClickExtendedAction.archive(e, props.folderData),
                        label: props.t('Archive'),
                        allowedRoleId: ROLE.contentManager.id
                      },
                      delete: {
                        callback: e => props.onClickExtendedAction.delete(e, props.folderData),
                        label: props.t('Delete'),
                        allowedRoleId: ROLE.contentManager.id
                      }
                    }}
                    folderData={props.folderData}
                  />
                </div>
              </div>
            </div>

            <div className='folder__header__status' />
          </div>
        </div>

        <div className='folder__content'>
          {sortWithFoldersAtListBeginning(sortListBy(folderContentList, props.selectedSortCriterion, props.sortOrder, props.lang))
            .map((content, i) => content.type === 'folder'
              ? (
                <FolderContainer
                  availableApp={props.availableApp}
                  folderData={content}
                  workspaceContentList={props.workspaceContentList}
                  getContentParentList={props.getContentParentList}
                  userRoleIdInWorkspace={props.userRoleIdInWorkspace}
                  onClickExtendedAction={props.onClickExtendedAction}
                  onClickFolder={props.onClickFolder}
                  onClickCreateContent={props.onClickCreateContent}
                  onDropMoveContentItem={props.onDropMoveContentItem}
                  modified={content.modified}
                  lang={props.lang}
                  currentRevisionType={content.currentRevisionType}
                  lastModifier={content.lastModifier}
                  contentType={props.contentType}
                  readStatusList={props.readStatusList}
                  onSetFolderRead={props.onSetFolderRead}
                  isLast={props.isLast && i === folderContentList.length - 1}
                  key={content.id}
                  t={props.t}
                  location={props.location}
                  selectedSortCriterion={props.selectedSortCriterion}
                  sortOrder={props.sortOrder}
                />
              )
              : (
                <ContentItem
                  contentId={content.id}
                  workspaceId={content.workspaceId}
                  parentId={content.parentId}
                  label={content.label}
                  type={content.type}
                  fileName={content.fileName}
                  fileExtension={content.fileExtension}
                  modified={content.modified}
                  lang={props.lang}
                  currentRevisionType={content.currentRevisionType}
                  lastModifier={content.lastModifier}
                  faIcon={props.contentType.length ? props.contentType.find(a => a.slug === content.type).faIcon : ''}
                  isShared={content.activedShares !== 0}
                  isTemplate={content.isTemplate}
                  statusSlug={content.statusSlug}
                  read={props.readStatusList.includes(content.id)}
                  contentType={props.contentType.length ? props.contentType.find(ct => ct.slug === content.type) : null}
                  urlContent={`${PAGE.WORKSPACE.CONTENT(content.workspaceId, content.type, content.id)}${props.location.search}`}
                  userRoleIdInWorkspace={props.userRoleIdInWorkspace}
                  onClickExtendedAction={{
                    edit: {
                      callback: e => props.onClickExtendedAction.edit(e, content),
                      label: props.t('Edit')
                    },
                    download: {
                      callback: e => props.onClickExtendedAction.download(e, content),
                      label: props.t('Download')
                    },
                    archive: {
                      callback: e => props.onClickExtendedAction.archive(e, content),
                      label: props.t('Archive')
                    },
                    delete: {
                      callback: e => props.onClickExtendedAction.delete(e, content),
                      label: props.t('Delete')
                    }
                  }}
                  onDropMoveContentItem={props.onDropMoveContentItem}
                  isLast={props.isLast && i === folderContentList.length - 1}
                  key={content.id}
                />
              )
            )}
        </div>
      </div>
    )
  }
}

const folderDragAndDropTarget = {
  drop: props => {
    return {
      workspaceId: props.folderData.workspaceId,
      contentId: props.folderData.id,
      parentId: props.folderData.parentId
    }
  }
}

const folderDragAndDropTargetCollect = (connect, monitor) => {
  return {
    connectDropTarget: connect.dropTarget(),
    canDrop: monitor.canDrop(),
    isOver: monitor.isOver({ shallow: false }),
    draggedItem: monitor.getItem()
  }
}

const folderDragAndDropSource = {
  beginDrag: props => {
    return {
      workspaceId: props.folderData.workspaceId,
      contentId: props.folderData.id,
      parentId: props.folderData.parentId || 0
    }
  },
  endDrag: (props, monitor) => {
    const item = monitor.getItem()
    const dropResult = monitor.getDropResult()
    if (dropResult) {
      props.onDropMoveContentItem(item, dropResult)
    }
  }
}

const folderDragAndDropSourceCollect = (connect, monitor) => ({
  connectDragPreview: connect.dragPreview(),
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
})

// INFO - CH - 2019-06-06 - Using a container for Folder instead of exporting directly Folder because if not, you can't
// nest drop target.
// Note that Folder component recursively use FolderContainer (see render() above)
// see https://github.com/react-dnd/react-dnd/issues/483
const FolderContainer = DragSource(DRAG_AND_DROP.CONTENT_ITEM, folderDragAndDropSource, folderDragAndDropSourceCollect)(
  DropTarget(DRAG_AND_DROP.CONTENT_ITEM, folderDragAndDropTarget, folderDragAndDropTargetCollect)(
    withRouter(Folder)
  )
)

export default translate()(FolderContainer)

Folder.propTypes = {
  loading: PropTypes.bool,
  folderData: PropTypes.object,
  app: PropTypes.array,
  onClickFolder: PropTypes.func.isRequired,
  isLast: PropTypes.bool.isRequired,
  lang: PropTypes.string.isRequired
}

Folder.defaultProps = {
  showCreateContentButton: true
}
