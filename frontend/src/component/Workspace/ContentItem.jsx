import React from 'react'
import { translate } from 'react-i18next'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { DragSource } from 'react-dnd'
import {
  ANCHOR_NAMESPACE,
  DRAG_AND_DROP,
  getRevisionTypeLabel
} from '../../util/helper.js'
import BtnExtandedAction from './BtnExtandedAction.jsx'
import {
  ROLE,
  ComposedIcon,
  FilenameWithBadges,
  ListItemWrapper,
  TimedEvent
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
        connectDragSource={props.userRoleIdInWorkspace >= ROLE.contentManager.id ? props.connectDragSource : undefined}
        contentType={props.contentType}
        isLast={props.isLast}
        isFirst={props.isFirst}
        key={props.id}
        id={`${ANCHOR_NAMESPACE.workspaceItem}:${props.contentId}`}
      >

        <Link
          to={props.urlContent}
          className='content__item'
          style={dropStyle}
        >
          <div
            className='content__dragPreview'
          >
            <div
              className='content__type'
              title={props.t(props.contentType.label)}
              style={{
                color: props.contentType.hexcolor,
                paddingInlineEnd: props.isShared ? 'unset' : '10px'
              }}
            >
              {(props.isShared
                ? (
                  <ComposedIcon
                    mainIcon={props.faIcon}
                    smallIcon='fas fa-share-alt'
                    // FIXME - GB - 2019-07-26 - Replace these hardcoded values by webpack variables
                    // https://github.com/tracim/tracim/issues/2098
                    smallIconStyle={{ color: '#252525' }}
                  />
                )
                : (
                  <i className={props.isDragging ? 'fas fa-arrows-alt' : `fa-fw ${props.faIcon}`} />
                )
              )}
            </div>
            <FilenameWithBadges file={props} isTemplate={props.isTemplate} customClass='content__name' />
          </div>

          <TimedEvent
            customClass='content__lastModification'
            operation={getRevisionTypeLabel(props.currentRevisionType, props.t)}
            date={props.modified}
            lang={props.lang}
            author={{
              publicName: props.lastModifier.public_name,
              userId: props.lastModifier.user_id
            }}
          />

          {props.userRoleIdInWorkspace >= ROLE.contributor.id && (
            <div className='d-none d-md-block content__actions' title={props.t('Actions')}>
              <BtnExtandedAction
                userRoleIdInWorkspace={props.userRoleIdInWorkspace}
                onClickExtendedAction={{
                  edit: {
                    callback: e => props.onClickExtendedAction.edit.callback(e, props.folderData),
                    label: props.onClickExtendedAction.edit.label,
                    allowedRoleId: ROLE.contributor.id
                  },
                  download: {
                    callback: e => props.onClickExtendedAction.download.callback(e, props.folderData),
                    label: props.onClickExtendedAction.download.label,
                    allowedRoleId: ROLE.reader.id
                  },
                  archive: {
                    callback: e => props.onClickExtendedAction.archive.callback(e, props.folderData),
                    label: props.onClickExtendedAction.archive.label,
                    allowedRoleId: ROLE.contentManager.id
                  },
                  delete: {
                    callback: e => props.onClickExtendedAction.delete.callback(e, props.folderData),
                    label: props.onClickExtendedAction.delete.label,
                    allowedRoleId: ROLE.contentManager.id
                  }
                }}
              />
            </div>
          )}

          <div
            className='content__status'
            title={props.t(status.label)}
          >
            <div className='content__status__icon'>
              <i
                className={`fa-fw ${status.faIcon}`}
                style={{ color: status.hexcolor }}
              />
            </div>
            <div className='content__status__text'>
              {props.t(status.label)}
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

export default DragSource(DRAG_AND_DROP.CONTENT_ITEM, contentItemDragAndDropSource, contentItemDragAndDropSourceCollect)(translate()(ContentItem))

ContentItem.propTypes = {
  contentType: PropTypes.object,
  customClass: PropTypes.string,
  label: PropTypes.string,
  faIcon: PropTypes.string,
  fileName: PropTypes.string,
  fileExtension: PropTypes.string,
  isShared: PropTypes.bool,
  isTemplate: PropTypes.bool,
  onClickItem: PropTypes.func,
  read: PropTypes.bool,
  statusSlug: PropTypes.string.isRequired,
  urlContent: PropTypes.string,
  userRoleIdInWorkspace: PropTypes.number,
  modified: PropTypes.string.isRequired,
  lang: PropTypes.string.isRequired,
  currentRevisionType: PropTypes.string.isRequired
}

ContentItem.defaultProps = {
  customClass: '',
  isShared: false,
  isTemplate: false,
  label: '',
  onClickItem: () => {},
  read: false,
  urlContent: '',
  userRoleIdInWorkspace: ROLE.reader.id
}
