import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import classnames from 'classnames'
// import FileItem from './ContentItem.jsx'
// import PopupExtandedAction from '../../container/PopupExtandedAction.jsx'
import SubDropdownCreateButton from '../common/Input/SubDropdownCreateButton.jsx'
import BtnExtandedAction from './BtnExtandedAction.jsx'
import ContentItem from './ContentItem.jsx'

class Folder extends React.Component {
  handleClickCreateContent = (e, folder, type) => {
    e.stopPropagation() // because we have a link inside a link (togler and newFile)
    this.props.onClickCreateContent(folder, type)
  }

  render () {
    const { props } = this

    return (
      <div className={classnames('folder', {'active': props.folderData.isOpen && props.folderData.content.length > 0, 'item-last': props.isLast})}>
        <div
          // Côme - 2018/11/06 - the .primaryColorBorderLightenHover is used by folder__header__triangleborder and folder__header__triangleborder__triangle
          // since they have the border-top-color: inherit on hover
          className='folder__header align-items-center primaryColorBgLightenHover primaryColorBorderLightenHover'
          onClick={() => props.onClickFolder(props.folderData.id)}
        >

          <div className='folder__header__triangleborder'>
            <div className='folder__header__triangleborder__triangle' />
          </div>

          <div className='folder__header__icon'>
            <i className={classnames('fa fa-fw', {'fa-folder-open-o': props.folderData.isOpen, 'fa-folder-o': !props.folderData.isOpen})} />
          </div>

          <div className='folder__header__name'>
            { props.folderData.label }
          </div>

          <div className='folder__header__button'>
            {props.idRoleUserWorkspace >= 2 &&
              <div className='folder__header__button__addbtn'>
                <button
                  className='folder__header__button__addbtn__text btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover dropdown-toggle'
                  type='button'
                  id='dropdownMenuButton'
                  data-toggle='dropdown'
                  aria-haspopup='true'
                  aria-expanded='false'
                  onClick={e => e.stopPropagation()}
                >
                  {`${props.t('Create in folder')}...`}
                </button>

                <div className='addbtn__subdropdown dropdown-menu' aria-labelledby='dropdownMenuButton'>
                  <SubDropdownCreateButton
                    idFolder={props.folderData.id}
                    availableApp={props.availableApp}
                    onClickCreateContent={props.onClickCreateContent}
                  />
                </div>

                <div className='d-none d-md-flex'>
                  <BtnExtandedAction
                    idRoleUserWorkspace={props.idRoleUserWorkspace}
                    onClickExtendedAction={{
                      edit: e => props.onClickExtendedAction.edit(e, props.folderData),
                      move: e => props.onClickExtendedAction.move(e, props.folderData),
                      download: e => props.onClickExtendedAction.download(e, props.folderData),
                      archive: e => props.onClickExtendedAction.archive(e, props.folderData),
                      delete: e => props.onClickExtendedAction.delete(e, props.folderData)
                    }}
                  />
                </div>
              </div>
            }
          </div>

          <div className='folder__header__status' />

        </div>

        <div className='folder__content'>
          {props.folderData.content.map((c, i) => c.type === 'folder'
            ? (
              <Folder
                availableApp={props.availableApp}
                folderData={{
                  ...c,
                  content: [] // @TODO
                }}
                onClickItem={props.onClickItem}
                idRoleUserWorkspace={props.idRoleUserWorkspace}
                onClickExtendedAction={props.onClickExtendedAction}
                onClickFolder={props.onClickFolder}
                onClickCreateContent={props.onClickCreateContent}
                isLast={i === props.folderData.content.length - 1}
                key={c.id}
              />
            )
            : (
              <ContentItem
                label={c.label}
                type={c.type}
                faIcon={props.contentType.length ? props.contentType.find(a => a.slug === c.type).faIcon : ''}
                statusSlug={c.statusSlug}
                read={false} // @TODO
                contentType={props.contentType.length ? props.contentType.find(ct => ct.slug === c.type) : null}
                onClickItem={() => props.onClickItem(c)}
                idRoleUserWorkspace={props.idRoleUserWorkspace}
                onClickExtendedAction={props.onClickExtendedAction}
                isLast={props.isLast} // isLast means among the entire contents of folder, not "is last of the current folder"
                key={c.id}
              />
            )
          )}
        </div>
      </div>
    )
  }
}

export default translate()(Folder)

Folder.propTypes = {
  folderData: PropTypes.object,
  app: PropTypes.array,
  onClickItem: PropTypes.func.isRequired,
  onClickFolder: PropTypes.func.isRequired,
  isLast: PropTypes.bool.isRequired
}
