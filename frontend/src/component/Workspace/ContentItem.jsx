import React from 'react'
import { withTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { DragSource } from 'react-dnd'
import { ROLE_OBJECT, DRAG_AND_DROP } from '../../helper.js'
import BtnExtandedAction from './BtnExtandedAction.jsx'
import DragHandle from '../DragHandle.jsx'
import {
  Badge,
  ListItemWrapper,
  ComposedIcon
} from 'tracim_frontend_lib'

class ContentItem extends React.Component {
  render () {
    const { props } = this

    const status = props.contentType.availableStatuses.find(s => s.slug === props.statusSlug) || {
      hexcolor: '',
      label: '',
      faIcon: ''
    }

    const dropStyle = {
      opacity: props.isDragging ? 0.5 : 1
    }

    return (
      <ListItemWrapper
        label={props.label}
        read={props.read}
        contentType={props.contentType}
        isLast={props.isLast}
        key={props.id}
      >
        {props.userRoleIdInWorkspace >= ROLE_OBJECT.contentManager.id && (
          <DragHandle
            connectDragSource={props.connectDragSource}
            title={props.t('Move this content')}
            style={{ top: '18px', left: '-2px', padding: '0 7px' }}
          />
        )}

        <Link
          to={props.urlContent}
          className='content__item'
          style={dropStyle}
        >
          <div
            className='content__dragPreview'
            ref={props.connectDragPreview}
          >
            <div className='content__type'
              title={props.t(props.contentType.label)}
              style={{ color: props.contentType.hexcolor }}
            >
              {props.isShared
                ? <ComposedIcon
                  mainIcon={props.faIcon}
                  smallIcon='share-alt'
                  // FIXME - GB - 2019-07-26 - Replace this hardcoded values to webpack variables
                  // https://github.com/tracim/tracim/issues/2098
                  smallIconStyle={{ color: '#252525' }}
                />
                : <i className={`fa fa-${props.faIcon}`} />
              }
            </div>

            <div className='content__name' title={props.label}>
              {props.label}
              {props.contentType.slug === 'file' && (
                <Badge text={props.fileExtension} customClass='badgeBackgroundColor' />
              )}
            </div>
          </div>

          {props.userRoleIdInWorkspace >= 2 && (
            <div className='d-none d-md-block' title={props.t('Actions')}>
              <BtnExtandedAction
                userRoleIdInWorkspace={props.userRoleIdInWorkspace}
                onClickExtendedAction={props.onClickExtendedAction}
              />
            </div>
          )}

          <div
            className='content__status d-sm-flex justify-content-between align-items-center'
            style={{ color: status.hexcolor }}
            title={props.t(status.label)}
          >
            <div className='content__status__text d-none d-sm-block'>
              {props.t(status.label)}
            </div>
            <div className='content__status__icon'>
              <i className={`fa fa-fw fa-${status.faIcon}`} />
            </div>
          </div>
        </Link>
      </ListItemWrapper>
    )
  }
}

const contentItemDragAndDropSource = {
  beginDrag: props => {
    return {
      workspaceId: props.workspaceId,
      contentId: props.contentId,
      parentId: props.parentId || 0
    }
  },
  endDrag (props, monitor) {
    const item = monitor.getItem()
    const dropResult = monitor.getDropResult()
    if (dropResult) {
      props.onDropMoveContentItem(item, dropResult)
    }
  }
}

const contentItemDragAndDropSourceCollect = (connect, monitor) => ({
  connectDragPreview: connect.dragPreview(),
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
})

export default DragSource(DRAG_AND_DROP.CONTENT_ITEM, contentItemDragAndDropSource, contentItemDragAndDropSourceCollect)(withTranslation()(ContentItem))

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
  urlContent: PropTypes.string,
  userRoleIdInWorkspace: PropTypes.number,
  isShared: PropTypes.bool
}

ContentItem.defaultProps = {
  label: '',
  customClass: '',
  onClickItem: () => {},
  read: false,
  urlContent: '',
  userRoleIdInWorkspace: 0,
  isShared: false
}
