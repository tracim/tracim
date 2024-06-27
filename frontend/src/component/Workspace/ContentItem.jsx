import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { DragSource } from 'react-dnd'
import {
  ANCHOR_NAMESPACE,
  DRAG_AND_DROP
} from '../../util/helper.js'
import BtnExtendedAction from './BtnExtendedAction.jsx'
import {
  APP_CUSTOM_ACTION_LOCATION_OBJECT,
  ROLE,
  buildAppCustomActionLinkList,
  ComposedIcon,
  FilenameWithBadges,
  ListItemWrapper,
  getRevisionTypeLabel,
  TimedEvent
} from 'tracim_frontend_lib'

class ContentItem extends React.Component {
  render () {
    const { props } = this

    const status = props.contentType.availableStatuses.find(s => s.slug === props.content.statusSlug) || {
      hexcolor: '',
      label: '',
      faIcon: ''
    }

    const dropStyle = {
      opacity: props.isDragging ? 0.5 : 1
    }

    const userWithRoleIdInWorkspace = {
      ...props.user,
      userRoleIdInWorkspace: props.userRoleIdInWorkspace
    }
    const appCustomActionList = props.system.config?.app_custom_actions
      ? buildAppCustomActionLinkList(
        props.system.config.app_custom_actions,
        APP_CUSTOM_ACTION_LOCATION_OBJECT.CONTENT_IN_LIST_DROPDOWN,
        props.content,
        userWithRoleIdInWorkspace,
        props.content.type,
        props.user.lang
      )
      : []

    return (
      <ListItemWrapper
        label={props.content.label}
        read={props.read}
        connectDragSource={props.userRoleIdInWorkspace >= ROLE.contentManager.id ? props.connectDragSource : undefined}
        contentType={props.contentType}
        isLast={props.isLast}
        isFirst={props.isFirst}
        key={props.id}
        id={`${ANCHOR_NAMESPACE.workspaceItem}:${props.content.contentId}`}
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
            <FilenameWithBadges file={props.content} isTemplate={props.isTemplate} customClass='content__name' />
          </div>

          <TimedEvent
            customClass='content__lastModification'
            operation={getRevisionTypeLabel(props.content.currentRevisionType, props.t)}
            date={props.content.modified}
            lang={props.user.lang}
            author={{
              publicName: props.content.lastModifier.public_name,
              userId: props.content.lastModifier.user_id
            }}
          />

          {props.userRoleIdInWorkspace >= ROLE.contributor.id && (
            <div className='d-none d-md-block content__actions' title={props.t('Actions')}>
              <BtnExtendedAction
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
                appCustomActionList={appCustomActionList}
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
      workspaceId: props.content.workspaceId,
      contentId: props.content.id,
      parentId: props.content.parentId || 0
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

const mapStateToProps = ({ system, user }) => ({ system, user })

export default DragSource(DRAG_AND_DROP.CONTENT_ITEM, contentItemDragAndDropSource, contentItemDragAndDropSourceCollect)(
  connect(mapStateToProps)(translate()(ContentItem))
)

ContentItem.propTypes = {
  content: PropTypes.object.isRequired,
  contentType: PropTypes.object,
  customClass: PropTypes.string,
  faIcon: PropTypes.string,
  isShared: PropTypes.bool,
  onClickItem: PropTypes.func,
  read: PropTypes.bool,
  urlContent: PropTypes.string,
  userRoleIdInWorkspace: PropTypes.number
}

ContentItem.defaultProps = {
  customClass: '',
  isShared: false,
  onClickItem: () => {},
  read: false,
  urlContent: '',
  userRoleIdInWorkspace: ROLE.reader.id
}
