import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import { translate } from 'react-i18next'
import classnames from 'classnames'
import { DragSource, DropTarget } from 'react-dnd'
import SubDropdownCreateButton from '../common/Input/SubDropdownCreateButton.jsx'
import BtnExtandedAction from './BtnExtandedAction.jsx'
import ContentItem from './ContentItem.jsx'
import DragHandle from '../DragHandle.jsx'
import {
  PAGE,
  ROLE_OBJECT,
  DRAG_AND_DROP,
  sortWorkspaceContents,
  SHARE_FOLDER_ID
} from '../../helper.js'
import { HACK_COLLABORA_CONTENT_TYPE } from '../../container/WorkspaceContent.jsx'

require('./Folder.styl')

class Folder extends React.Component {
  calculateIcon = () => {
    const { props } = this

    const isDropActive = props.canDrop && props.isOver
    const isHoveringSelf = props.draggedItem && props.draggedItem.contentId === props.folderData.id

    if (!isDropActive || isHoveringSelf) {
      if (props.folderData.isOpen) return 'fa-folder-open-o'
      return 'fa-folder-o'
    }

    if (props.folderData.parentId === SHARE_FOLDER_ID) return 'fa-times-circle primaryColorFont'

    const isHoveringSelfParent = props.draggedItem && props.draggedItem.parentId === props.folderData.id
    if (isHoveringSelfParent) return 'fa-times-circle primaryColorFont'

    const parentIdList = props.getContentParentList(props.folderData, props.workspaceContentList)
    const isHoveringChildrenFolder = parentIdList.includes(props.draggedItem.contentId)
    if (isHoveringChildrenFolder) return 'fa-times-circle primaryColorFont'

    return 'fa-arrow-circle-down primaryColorFont'
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

    return (
      <div
        className={classnames('folder', {
          'active': props.folderData.isOpen && folderContentList.length > 0,
          'item-last': props.isLast,
          'read': true // props.readStatusList.includes(props.folderData.id) // Côme - 2018/11/27 - need to decide what we do for folder read status. See tracim/tracim #1189
        })}
        data-cy={`folder_${props.folderData.id}`}
        id={props.folderData.id}
      >
        <div
          // Côme - 2018/11/06 - the .primaryColorBorderLightenHover is used by folder__header__triangleborder and folder__header__triangleborder__triangle
          // since they have the border-top-color: inherit on hover
          className='folder__header align-items-center primaryColorBgLightenHover'
          onClick={() => props.onClickFolder(props.folderData.id)}
          ref={props.connectDropTarget}
          title={props.folderData.label}
        >
          <div className='folder__header__triangleborder'>
            <div className='folder__header__triangleborder__triangle primaryColorFontLighten' />
          </div>

          {props.userRoleIdInWorkspace >= ROLE_OBJECT.contentManager.id && (
            <DragHandle
              connectDragSource={props.connectDragSource}
              title={props.t('Move this folder')}
              style={{ top: '18px', left: '-2px', padding: '0 7px' }}
            />
          )}

          <div
            className='folder__header__dragPreview'
            ref={props.connectDragPreview}
          >
            <div className='folder__header__icon'
              title={props.t('Folder')}
              style={{ color: props.contentType.find(c => c.slug === 'folder').hexcolor }}
            >
              <i className={classnames('fa fa-fw', this.calculateIcon())} />
            </div>

            <div className='folder__header__name'>
              { props.folderData.label }
            </div>
          </div>

          <div className='folder__header__button'>
            {props.userRoleIdInWorkspace >= 2 && (
              <div className='folder__header__button__addbtn'>
                {props.showCreateContentButton && folderAvailableApp.length > 0 && (
                  <div title={props.t('Create in folder')}>
                    <button
                      className={classnames(
                        'folder__header__button__addbtn__text',
                        'btn',
                        'outlineTextBtn',
                        'primaryColorBorder',
                        'primaryColorBgHover',
                        'primaryColorBorderDarkenHover',
                        'dropdown-toggle',
                        props.userRoleIdInWorkspace === 2 ? 'no-margin-right' : ''
                      )}
                      type='button'
                      id='dropdownMenuButton'
                      data-toggle='dropdown'
                      aria-haspopup='true'
                      aria-expanded='false'
                      onClick={e => e.stopPropagation()}
                    >
                      <span className='folder__header__button__addbtn__text-desktop'>
                        {`${props.t('Create in folder')}...`}
                      </span>

                      <span className='folder__header__button__addbtn__text-responsive'>
                        <i className='folder__header__button__addbtn__text-responsive__iconplus fa fa-plus' />
                      </span>
                    </button>

                    <div className='addbtn__subdropdown dropdown-menu' aria-labelledby='dropdownMenuButton'>
                      <SubDropdownCreateButton
                        folderId={props.folderData.id}
                        availableApp={folderAvailableApp}
                        onClickCreateContent={(e, folderId, slug) => props.onClickCreateContent(e, folderId, slug)}
                      />
                    </div>
                  </div>
                )}

                <div className='d-none d-md-flex' title={props.t('Actions')}>
                  {props.userRoleIdInWorkspace >= 4 && (
                    <BtnExtandedAction
                      userRoleIdInWorkspace={props.userRoleIdInWorkspace}
                      onClickExtendedAction={{
                        edit: {
                          callback: e => props.onClickExtendedAction.edit(e, props.folderData),
                          label: props.t('Edit')
                        },
                        download: {
                          callback: e => props.onClickExtendedAction.download(e, props.folderData),
                          label: props.t('Download')
                        },
                        archive: {
                          callback: e => props.onClickExtendedAction.archive(e, props.folderData),
                          label: props.t('Archive')
                        },
                        delete: {
                          callback: e => props.onClickExtendedAction.delete(e, props.folderData),
                          label: props.t('Delete')
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className='folder__header__status' />

        </div>

        <div className='folder__content'>
          {folderContentList.sort(sortWorkspaceContents).map((content, i) => content.type === 'folder'
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
                contentType={props.contentType}
                readStatusList={props.readStatusList}
                setFolderRead={props.setFolderRead}
                isLast={props.isLast && i === folderContentList.length - 1}
                key={content.id}
                t={props.t}
                location={props.location}
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
                faIcon={props.contentType.length ? props.contentType.find(a => a.slug === content.type).faIcon : ''}
                isShared={content.activedShares !== 0}
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
  folderData: PropTypes.object,
  app: PropTypes.array,
  onClickFolder: PropTypes.func.isRequired,
  isLast: PropTypes.bool.isRequired
}

Folder.defaultProps = {
  showCreateContentButton: true
}
