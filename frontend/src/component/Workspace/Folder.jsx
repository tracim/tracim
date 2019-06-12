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
  CONTENT_TYPE
} from '../../helper.js'
import { ListItemWrapper } from 'tracim_frontend_lib'

require('./Folder.styl')

class Folder extends React.Component {
  calculateIcon = (folder, isDropActive, draggedItem = null) => {
    const isHoveringSelf = draggedItem && draggedItem.contentId === folder.id

    if (!isDropActive || isHoveringSelf) {
      if (folder.isOpen) return 'fa-folder-open-o'
      else return 'fa-folder-o'
    }

    const isHoveringSelfParent = draggedItem && draggedItem.parentId === folder.id
    const isHoveringChildrenFolder = draggedItem.subFolderIdList && draggedItem.subFolderIdList.some(subFolderId => folder.id === subFolderId)

    if (isHoveringSelfParent || isHoveringChildrenFolder) return 'fa-times-circle primaryColorFont'
    else return 'fa-arrow-circle-down primaryColorFont'
  }

  render () {
    const { props } = this

    const folderContentList = props.folderData.content.filter(c => c.idParent === props.folderData.id)

    const folderAvailableApp = props.availableApp.filter(a => props.folderData.subContentTypeList.includes(a.slug))

    const isDropActive = props.canDrop && props.isOver

    return (
      <div
        className={classnames('folder', {
          'active': props.folderData.isOpen && folderContentList.length > 0,
          'item-last': props.isLast,
          'read': true // props.readStatusList.includes(props.folderData.id) // Côme - 2018/11/27 - need to decide what we do for folder read status. See tracim/tracim #1189
        })}
        data-cy={`folder_${props.folderData.id}`}
      >
        <div
          // Côme - 2018/11/06 - the .primaryColorBorderLightenHover is used by folder__header__triangleborder and folder__header__triangleborder__triangle
          // since they have the border-top-color: inherit on hover
          className='folder__header align-items-center primaryColorBgLightenHover primaryColorBorderLightenHover'
          onClick={() => props.onClickFolder(props.folderData.id)}
          ref={props.connectDropTarget}
        >
          <div className='folder__header__triangleborder'>
            <div className='folder__header__triangleborder__triangle' />
          </div>

          {props.idRoleUserWorkspace >= ROLE_OBJECT.contentManager.id && (
            <DragHandle
              connectDragSource={props.connectDragSource}
              title={props.t('Move this folder')}
            />
          )}

          <div
            className='folder__header__dragPreview'
            ref={props.connectDragPreview}
          >
            <div className='folder__header__icon' style={{color: props.contentType.find(c => c.slug === 'folder').hexcolor}}>
              <i className={classnames('fa fa-fw', this.calculateIcon(props.folderData, isDropActive, props.draggedItem))} />
            </div>

            <div className='folder__header__name'>
              { props.folderData.label }
            </div>
          </div>

          <div className='folder__header__button'>
            {props.idRoleUserWorkspace >= 2 &&
              <div className='folder__header__button__addbtn'>
                {folderAvailableApp.length > 0 && (
                  <div>
                    <button
                      className={`
                        folder__header__button__addbtn__text
                        btn
                        outlineTextBtn
                        primaryColorBorder
                        primaryColorBgHover
                        primaryColorBorderDarkenHover
                        dropdown-toggle
                        ${props.idRoleUserWorkspace === 2 ? 'no-margin-right' : ''}
                      `}
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
                        idFolder={props.folderData.id}
                        availableApp={folderAvailableApp}
                        onClickCreateContent={(e, idFolder, slug) => props.onClickCreateContent(e, idFolder, slug)}
                      />
                    </div>
                  </div>
                )}

                <div className='d-none d-md-flex'>
                  {props.idRoleUserWorkspace >= 4 && (
                    <BtnExtandedAction
                      idRoleUserWorkspace={props.idRoleUserWorkspace}
                      onClickExtendedAction={{
                        edit: e => props.onClickExtendedAction.edit(e, props.folderData),
                        move: null,
                        download: e => props.onClickExtendedAction.download(e, props.folderData),
                        archive: e => props.onClickExtendedAction.archive(e, props.folderData),
                        delete: e => props.onClickExtendedAction.delete(e, props.folderData)
                      }}
                    />
                  )}
                </div>
              </div>
            }
          </div>

          <div className='folder__header__status' />

        </div>

        <div className='folder__content'>
          {folderContentList.map((content, i) => content.type === 'folder'
            ? (
              <FolderContainer
                availableApp={props.availableApp}
                folderData={{
                  ...content,
                  content: props.folderData.content.filter(c => c.idParent !== props.folderData.id)
                }}
                idRoleUserWorkspace={props.idRoleUserWorkspace}
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
              <ListItemWrapper
                label={content.label}
                read={props.readStatusList.includes(content.id)}
                contentType={props.contentType.length ? props.contentType.find(ct => ct.slug === content.type) : null}
                isLast={props.isLast && i === folderContentList.length - 1}
                key={content.id}
              >
                <ContentItem
                  contentId={content.id}
                  workspaceId={content.idWorkspace}
                  parentId={content.idParent}
                  label={content.label}
                  type={content.type}
                  fileName={content.fileName}
                  fileExtension={content.fileExtension}
                  faIcon={props.contentType.length ? props.contentType.find(a => a.slug === content.type).faIcon : ''}
                  statusSlug={content.statusSlug}
                  read={props.readStatusList.includes(content.id)}
                  contentType={props.contentType.length ? props.contentType.find(ct => ct.slug === content.type) : null}
                  urlContent={`${PAGE.WORKSPACE.CONTENT(content.idWorkspace, content.type, content.id)}${props.location.search}`}
                  idRoleUserWorkspace={props.idRoleUserWorkspace}
                  onClickExtendedAction={{
                    edit: e => props.onClickExtendedAction.edit(e, content),
                    move: null, // e => props.onClickExtendedAction.move(e, content),
                    download: e => props.onClickExtendedAction.download(e, content),
                    archive: e => props.onClickExtendedAction.archive(e, content),
                    delete: e => props.onClickExtendedAction.delete(e, content)
                  }}
                  onDropMoveContentItem={props.onDropMoveContentItem}
                  isLast={props.isLast && i === folderContentList.length - 1}
                  key={content.id}
                />
              </ListItemWrapper>
            )
          )}
        </div>
      </div>
    )
  }
}

const folderDndTarget = {
  drop: props => ({
    workspaceId: props.folderData.idWorkspace,
    parentId: props.folderData.id
  })
}

const folderDndTargetCollect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  canDrop: monitor.canDrop(),
  isOver: monitor.isOver({shallow: false}),
  draggedItem: monitor.getItem()
})

const folderDndSource = {
  beginDrag: props => ({
    workspaceId: props.folderData.idWorkspace,
    contentId: props.folderData.id,
    parentId: props.folderData.idParent || 0,
    subFolderIdList: props.folderData.content.filter(c => c.type === CONTENT_TYPE.FOLDER).map(c => c.id)
  }),
  endDrag (props, monitor) {
    const item = monitor.getItem()
    const dropResult = monitor.getDropResult()
    if (dropResult) {
      props.onDropMoveContentItem(item, dropResult)
    }
  }
}

const folderDndSourceCollect = (connect, monitor) => ({
  connectDragPreview: connect.dragPreview(),
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
})

// INFO - CH - 2019-06-06 - Using a container for Folder instead of exporting directly Folder because if not, you can't
// nest drop target.
// Note that Folder component recursively use FolderContainer (see render() above)
// see https://github.com/react-dnd/react-dnd/issues/483
const FolderContainer = DragSource(DRAG_AND_DROP.CONTENT_ITEM, folderDndSource, folderDndSourceCollect)(
  DropTarget(DRAG_AND_DROP.CONTENT_ITEM, folderDndTarget, folderDndTargetCollect)(
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
