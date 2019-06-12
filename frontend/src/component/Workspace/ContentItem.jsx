import React from 'react'
import { translate } from 'react-i18next'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { DragSource } from 'react-dnd'
import { ROLE_OBJECT, DRAG_AND_DROP } from '../../helper.js'
import BtnExtandedAction from './BtnExtandedAction.jsx'
import DragHandle from '../DragHandle.jsx'
import { Badge } from 'tracim_frontend_lib'

const ContentItem = props => {
  const status = props.contentType.availableStatuses.find(s => s.slug === props.statusSlug) || {hexcolor: '', label: '', faIcon: ''}

  const dropStyle = {
    opacity: props.isDragging ? 0.5 : 1
  }

  return (
    <Link
      to={props.urlContent}
      className='content__item'
      style={dropStyle}
    >
      {props.idRoleUserWorkspace >= ROLE_OBJECT.contentManager.id && (
        <DragHandle
          connectDragSource={props.connectDragSource}
          title={props.t('Move this content')}
        />
      )}

      <div
        className='content__dragPreview'
        ref={props.connectDragPreview}
      >
        <div className='content__type' style={{color: props.contentType.hexcolor}}>
          <i className={`fa fa-fw fa-${props.faIcon}`} />
        </div>

        <div className='content__name'>
          {props.label}
          {props.contentType.slug === 'file' && (
            <Badge text={props.fileExtension} customClass='badgeBackgroundColor' />
          )}
        </div>
      </div>

      {props.idRoleUserWorkspace >= 2 && (
        <div className='d-none d-md-block'>
          <BtnExtandedAction
            idRoleUserWorkspace={props.idRoleUserWorkspace}
            onClickExtendedAction={props.onClickExtendedAction}
          />
        </div>
      )}

      <div
        className='content__status d-sm-flex justify-content-between align-items-center'
        style={{color: status.hexcolor}}
      >
        <div className='content__status__text d-none d-sm-block'>
          {props.t(status.label)}
        </div>
        <div className='content__status__icon'>
          <i className={`fa fa-fw fa-${status.faIcon}`} />
        </div>
      </div>
    </Link>
  )
}

const contentItemDndSource = {
  beginDrag: props => ({
    workspaceId: props.workspaceId,
    contentId: props.contentId,
    parentId: props.parentId || 0
  }),
  endDrag (props, monitor) {
    const item = monitor.getItem()
    const dropResult = monitor.getDropResult()
    if (dropResult) {
      props.onDropMoveContentItem(item, dropResult)
    }
  }
}

const contentItemDndSourceCollect = (connect, monitor) => ({
  connectDragPreview: connect.dragPreview(),
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
})

export default DragSource(DRAG_AND_DROP.CONTENT_ITEM, contentItemDndSource, contentItemDndSourceCollect)(translate()(ContentItem))

ContentItem.propTypes = {
  statusSlug: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  label: PropTypes.string,
  fileName: PropTypes.string,
  fileExtension: PropTypes.string,
  contentType: PropTypes.object,
  onClickItem: PropTypes.func,
  faIcon: PropTypes.string,
  read: PropTypes.bool,
  urlContent: PropTypes.string
}

ContentItem.defaultProps = {
  label: '',
  customClass: '',
  onClickItem: () => {},
  read: false,
  urlContent: ''
}
