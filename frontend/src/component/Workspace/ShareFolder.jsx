import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import classnames from 'classnames'
import ContentItem from './ContentItem.jsx'
import Folder from './Folder.jsx'
import { SHARE_FOLDER_ID } from '../../util/helper.js'
import {
  ROLE,
  DropdownMenu,
  Loading,
  PAGE
} from 'tracim_frontend_lib'

require('./Folder.styl')

class ShareFolder extends React.Component {
  handleClickOpenShareFolderApp = e => {
    const { props } = this

    e.stopPropagation()
    props.history.push(PAGE.WORKSPACE.SHARE_FOLDER(props.workspaceId) + props.location.search)
  }

  getIcon = () => {
    // INFO - G.B. - 2019-08-20 - This function always returns the same icon, but I've kept it like that for future improvement.
    // I think it is good to clearly indicate where to change if you want to have a different icon to a open/close share folder.
    return 'fa-share-alt'
  }

  render () {
    const { props } = this

    const folderContentList = (props.shareFolderContentList ? props.shareFolderContentList : [])
      .filter(content => content.parentId === SHARE_FOLDER_ID)
      .sort((a, b) => a.created - b.created)

    return (
      <div
        className={classnames('folder', {
          active: props.isOpen && folderContentList.length > 0,
          'item-last': props.isLast,
          read: true // props.readStatusList.includes(props.folderData.id) // Côme - 2018/11/27 - need to decide what we do for folder read status. See tracim/tracim #1189
        })}
        data-cy={SHARE_FOLDER_ID}
        id={SHARE_FOLDER_ID}
      >
        <div
          className='folder__header align-items-center'
          onClick={() => props.onClickShareFolder()}
          title={props.t('Received files')}
        >
          <div className='folder__header__triangleborder'>
            <div className='folder__header__triangleborder__triangle' />
          </div>

          <div className='folder__header__dragPreview'>
            <div
              className='folder__header__icon'
              title={props.t('Folder')}
              style={{ color: (props.contentType.find(c => c.slug === 'folder') || { hexcolor: '' }).hexcolor }}
            >
              <i className={classnames('fas fa-fw', this.getIcon())} />
            </div>

            <div className='folder__header__name'>
              {props.t('Received files')}
            </div>
          </div>

          <div className='folder__header__button'>
            <div className='d-none d-md-flex' title={props.t('Actions')}>
              {props.userRoleIdInWorkspace >= ROLE.contentManager.id && (
                <DropdownMenu
                  buttonIcon='fas fa-ellipsis-h'
                  buttonCustomClass='extandedaction outlineTextBtn primaryColorBgHover primaryColorBorderDarkenHover'
                  buttonDataCy='extended_action'
                  isButton
                >
                  <button
                    className='transparentButton'
                    onClick={this.handleClickOpenShareFolderApp}
                  >
                    <i className='fas fa-fw fa-pencil-alt' />
                    {props.t('Manage')}
                  </button>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className='folder__header__status' />

        </div>

        <div className='folder__content'>
          {props.loading ? <Loading /> : (folderContentList.map((content, index) => content.type === 'folder'
            ? (
              <Folder
                availableApp={props.availableApp}
                folderData={content}
                showCreateContentButton={false}
                workspaceContentList={props.shareFolderContentList}
                getContentParentList={props.getContentParentList}
                userRoleIdInWorkspace={props.userRoleIdInWorkspace}
                lang={props.lang}
                onClickExtendedAction={props.onClickExtendedAction}
                onDropMoveContentItem={props.onDropMoveContentItem}
                onClickFolder={props.onClickFolder}
                onClickCreateContent={props.onClickCreateContent}
                contentType={props.contentType}
                readStatusList={props.readStatusList}
                onSetFolderRead={props.onSetFolderRead}
                isLast={index === props.shareFolderContentList.length - 1}
                key={content.id}
                t={props.t}
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
                  download: e => props.onClickExtendedAction.download(e, content),
                  archive: e => props.onClickExtendedAction.archive(e, content),
                  delete: e => props.onClickExtendedAction.delete(e, content)
                }}
                onDropMoveContentItem={props.onDropMoveContentItem}
                isLast={props.isLast && index === folderContentList.length - 1}
                key={content.id}
              />
            )
          ))}
        </div>
      </div>
    )
  }
}

export default translate()(withRouter(ShareFolder))

ShareFolder.propTypes = {
  loading: PropTypes.bool,
  folderData: PropTypes.object,
  app: PropTypes.array,
  lang: PropTypes.string,
  onClickShareFolder: PropTypes.func.isRequired,
  isLast: PropTypes.bool.isRequired
}
