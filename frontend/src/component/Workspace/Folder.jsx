import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import classnames from 'classnames'
import SubDropdownCreateButton from '../common/Input/SubDropdownCreateButton.jsx'
import BtnExtandedAction from './BtnExtandedAction.jsx'
import ContentItem from './ContentItem.jsx'
import { PAGE } from '../../helper.js'
import { ListItemWrapper } from 'tracim_frontend_lib'

require('./Folder.styl')

class Folder extends React.Component {
  render () {
    const { props } = this

    const folderContentList = props.folderData.content.filter(c => c.idParent === props.folderData.id)

    const folderAvailableApp = props.availableApp.filter(a => props.folderData.subContentTypeList.includes(a.slug))

    return (
      <div className={classnames('folder', {
        'active': props.folderData.isOpen && folderContentList.length > 0,
        'item-last': props.isLast,
        'read': true // props.readStatusList.includes(props.folderData.id) // Côme - 2018/11/27 - need to decide what we do for folder read status. See tracim/tracim #1189
      })}>
        <div
          // Côme - 2018/11/06 - the .primaryColorBorderLightenHover is used by folder__header__triangleborder and folder__header__triangleborder__triangle
          // since they have the border-top-color: inherit on hover
          className='folder__header align-items-center primaryColorBgLightenHover primaryColorBorderLightenHover'
          onClick={() => props.onClickFolder(props.folderData.id)}
        >
          <div className='folder__header__triangleborder'>
            <div className='folder__header__triangleborder__triangle' />
          </div>

          <div className='folder__header__icon' style={{color: props.contentType.find(c => c.slug === 'folder').hexcolor}}>
            <i className={classnames('fa fa-fw', {'fa-folder-open-o': props.folderData.isOpen, 'fa-folder-o': !props.folderData.isOpen})} />
          </div>

          <div className='folder__header__name'>
            { props.folderData.label }
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
                        move: null, // e => props.onClickExtendedAction.move(e, props.folderData),
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
              <Folder
                availableApp={props.availableApp}
                folderData={{
                  ...content,
                  content: props.folderData.content.filter(c => c.idParent !== props.folderData.id)
                }}
                idRoleUserWorkspace={props.idRoleUserWorkspace}
                onClickExtendedAction={props.onClickExtendedAction}
                onClickFolder={props.onClickFolder}
                onClickCreateContent={props.onClickCreateContent}
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

export default withRouter(Folder)

Folder.propTypes = {
  folderData: PropTypes.object,
  app: PropTypes.array,
  onClickFolder: PropTypes.func.isRequired,
  isLast: PropTypes.bool.isRequired
}
