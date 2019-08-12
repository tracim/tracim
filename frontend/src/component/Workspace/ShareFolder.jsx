import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import { translate } from 'react-i18next'
import classnames from 'classnames'
import ContentItem from './ContentItem.jsx'
import {
  PAGE
} from '../../helper.js'

require('./Folder.styl')

class ShareFolder extends React.Component {
  calculateIcon = () => {
    const { props } = this

    if (props.folderData.isOpen) return 'fa-share-alt'

    return 'fa-share-alt'
  }

  render () {
    const { props } = this

    const folderContentList = props.workspaceContentList
      .filter(c => c.parentId === props.folderData.id)
      .sort((a, b) => {
        if (a.created > b.created) {
          return -1
        } else {
          return 1
        }
      })

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
          className='folder__header align-items-center primaryColorBgLightenHover'
          onClick={() => props.onClickFolder(props.folderData.id)}
          ref={props.connectDropTarget}
          title={props.folderData.label}
        >
          <div className='folder__header__triangleborder'>
            <div className='folder__header__triangleborder__triangle primaryColorFontLighten' />
          </div>

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
            <div className='d-none d-md-flex' title={props.t('Actions')}>
              {props.userRoleIdInWorkspace >= 4 && (
                <div
                  className='extandedaction dropdown'
                  data-cy='extended_action'
                >
                  <button
                    className='extandedaction__button btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover dropdown-toggle'
                    type='button'
                    id='dropdownMenuButton'
                    data-toggle='dropdown'
                    aria-haspopup='true'
                    aria-expanded='false'
                    onClick={e => e.stopPropagation()}
                  >
                    <i className='fa fa-fw fa-ellipsis-h' />
                  </button>

                  <div className='extandedaction__subdropdown dropdown-menu' aria-labelledby='dropdownMenuButton'>
                    <div
                      className='subdropdown__item primaryColorBgLightenHover dropdown-item d-flex align-items-center'
                      onClick={e => props.onClickExtendedAction.edit(e, props.folderData)}
                    >
                      <div className='subdropdown__item__icon mr-3'>
                        <i className='fa fa-fw fa-pencil' />
                      </div>

                      <div className='subdropdown__item__text'>
                        {props.t('Edit')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className='folder__header__status' />

        </div>

        <div className='folder__content'>
          {folderContentList.map((content, i) => content.type === 'folder'
            ? (
              <ShareFolder
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
                  edit: e => props.onClickExtendedAction.edit(e, content),
                  move: null,
                  download: null,
                  archive: null,
                  delete: null
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

export default translate()(withRouter(ShareFolder))

ShareFolder.propTypes = {
  folderData: PropTypes.object,
  app: PropTypes.array,
  onClickFolder: PropTypes.func.isRequired,
  isLast: PropTypes.bool.isRequired
}
