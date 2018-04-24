import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import FileItem from './FileItem.jsx'
import PopupExtandedAction from '../../container/PopupExtandedAction.jsx'

class Folder extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      open: false,
      openExtandedAction: false
    }
  }

  handleClickToggleFolder = () => {
    !this.state.open && this.props.folderData.content.length === 0 && this.props.onClickFolder(this.props.folderData.id)
    this.setState({open: !this.state.open})
  }

  handleClickNewFile = e => {
    e.stopPropagation() // because we have a link inside a link (togler and newFile)
    console.log('new file') // @TODO
  }

  handleClickModify = e => {
    e.stopPropagation() // because we have a link inside a link (togler and newFile)
    console.log('modifier') // @TODO
  }

  handleClickToggleExtandedAction = e => {
    e.stopPropagation()

    this.setState(prevState => ({
      openExtandedAction: !prevState.openExtandedAction
    }))
  }

  render () {
    const { app, folderData, onClickItem, onClickFolder, isLast, t } = this.props

    return (
      <div className={classnames('folder', {'active': this.state.open, 'item-last': isLast})}>
        <div className='folder__header align-items-center' onClick={this.handleClickToggleFolder}>
          <div className='folder__header__triangleborder'>
            <div className='folder__header__triangleborder__triangle' />
          </div>

          <div className='col-2 col-sm-2 col-md-2 col-lg-2 col-xl-1'>
            <div className='folder__header__name__icon'>
              <i className={classnames('fa', {'fa-folder-open-o': this.state.open, 'fa-folder-o': !this.state.open})} />
            </div>
          </div>

          <div className='col-10 col-sm-10 col-md-10 col-lg-10 col-xl-11'>
            <div className='folder__header__name align-items-center justify-content-between'>

              <div className='folder__header__name__text'>
                { folderData.title }
              </div>

              <div className='folder__header__name__button d-flex align-items-center '>

                {this.state.openExtandedAction === false &&
                  <div>
                    <div className='folder__header__name__button__advancedbtn btn btn-outline-primary d-none d-md-block' onClick={this.handleClickToggleExtandedAction}>
                      <i className='fa fa-fw fa-ellipsis-h' />
                    </div>
                  </div>
                }

                {this.state.openExtandedAction === true &&
                  <PopupExtandedAction
                    openExtandedAction={this.state.openExtandedAction}
                    onClickCloseBtn={this.handleClickToggleExtandedAction}
                  />
                }

                <div className='folder__header__name__button__addbtn mx-4' onClick={this.handleClickNewFile}>
                  <button className='addbtn__text btn btn-outline-primary dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                    {t('Folder.create')} ...
                  </button>
                  <div className='addbtn__subdropdown dropdown-menu' aria-labelledby='dropdownMenuButton'>
                    <div className='subdropdown__link dropdown-item'>
                      <div className='subdropdown__link__folder d-flex align-items-center'>
                        <div className='subdropdown__link__folder__icon mr-3'>
                          <i className='fa fa-fw fa-folder-o' />
                        </div>
                        <div className='subdropdown__link__folder__text'>
                          Créer un Dossier
                        </div>
                      </div>
                    </div>
                    <div className='subdropdown__link dropdown-item'>
                      <div className='subdropdown__link__apphtml d-flex align-items-center'>
                        <div className='subdropdown__link__apphtml__icon mr-3'>
                          <i className='fa fa-fw fa-file-text-o' />
                        </div>
                        <div className='subdropdown__link__apphtml__text'>
                          Créer une page Html
                        </div>
                      </div>
                    </div>
                    <div className='subdropdown__link dropdown-item'>
                      <div className='subdropdown__link__appfile d-flex align-items-center'>
                        <div className='subdropdown__link__appfile__icon mr-3'>
                          <i className='fa fa-fw fa-file-image-o' />
                        </div>
                        <div className='subdropdown__link__appfile__text'>
                          Importer un fichier
                        </div>
                      </div>
                    </div>
                    <div className='subdropdown__link dropdown-item'>
                      <div className='subdropdown__link__appmarkdown d-flex align-items-center'>
                        <div className='subdropdown__link__appmarkdown__icon mr-3'>
                          <i className='fa fa-fw fa-file-code-o' />
                        </div>
                        <div className='subdropdown__link__appmarkdown__text'>
                          Créer une page markdown
                        </div>
                      </div>
                    </div>
                    <div className='subdropdown__link dropdown-item'>
                      <div className='subdropdown__link__appthread d-flex align-items-center'>
                        <div className='subdropdown__link__appthread__icon mr-3'>
                          <i className='fa fa-fw fa-comments-o' />
                        </div>
                        <div className='subdropdown__link__appthread__text'>
                          Créer une discussion
                        </div>
                      </div>
                    </div>
                    <div className='subdropdown__link dropdown-item'>
                      <div className='subdropdown__link__apptask d-flex align-items-center'>
                        <div className='subdropdown__link__apptask__icon mr-3'>
                          <i className='fa fa-fw fa-list-ul' />
                        </div>
                        <div className='subdropdown__link__apptask__text'>
                          Créer une tâche
                        </div>
                      </div>
                    </div>
                    <div className='subdropdown__link dropdown-item'>
                      <div className='subdropdown__link__appissue d-flex align-items-center'>
                        <div className='subdropdown__link__appissue__icon mr-3'>
                          <i className='fa fa-fw fa-ticket' />
                        </div>
                        <div className='subdropdown__link__appissue__text'>
                          Créer un ticket
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* <div className='col-5 col-sm-5 col-md-5 col-lg-4 col-xl-3 d-none'>
            <div className='folder__header__contenttype d-none d-sm-flex'>
              <div className='folder__header__contenttype__text d-none d-lg-flex'>
                {t('Folder.content_type')} :
              </div>
              <div className='folder__header__contenttype__icon'>
                { folderData.allowed_app.map(a => <i className={(app[a] || {icon: ''}).icon} key={`${folderData.id}_${a}`} />)}
              </div>
            </div>
          </div>
        </div>

        <div className='folder__content'>
          { folderData.content.map((c, i) => c.type === 'folder'
            ? <Folder
              app={app}
              folderData={c}
              onClickItem={onClickItem}
              onClickFolder={onClickFolder}
              isLast={isLast}
              t={t}
              key={c.id}
            />
            : <FileItem
              icon={(app[c.type] || {icon: ''}).icon}
              name={c.title}
              type={c.type}
              status={c.status}
              onClickItem={() => onClickItem(c)}
              isLast={isLast && i === folderData.content.length - 1}
              key={c.id}
            />
          )} */}
        </div>
      </div>
    )
  }
}

export default translate()(Folder)

Folder.propTypes = {
  folderData: PropTypes.shape({
    title: PropTypes.string.isRequired,
    content: PropTypes.array
  }),
  app: PropTypes.object,
  onClickItem: PropTypes.func.isRequired,
  onClickFolder: PropTypes.func.isRequired,
  isLast: PropTypes.bool.isRequired
}
