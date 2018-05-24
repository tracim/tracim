import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import FileItem from './ContentItem.jsx'
// import PopupExtandedAction from '../../container/PopupExtandedAction.jsx'
import BtnExtandedAction from './BtnExtandedAction.jsx'

class Folder extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      open: false
    }
  }

  handleClickToggleFolder = () => {
    !this.state.open && this.props.folderData.content.length === 0 && this.props.onClickFolder(this.props.folderData.id)
    this.setState({open: !this.state.open})
  }

  handleClickCreateContent = (e, folder, type) => {
    e.stopPropagation() // because we have a link inside a link (togler and newFile)
    this.props.onClickCreateContent(folder, type)
  }

  render () {
    const {
      app,
      folderData,
      onClickItem,
      onClickExtendedAction,
      onClickFolder,
      isLast,
      t
    } = this.props

    return (
      <div className={classnames('folder', {'active': this.state.open && folderData.content.length > 0, 'item-last': isLast})}>
        <div className='folder__header align-items-center' onClick={this.handleClickToggleFolder}>

          <div className='folder__header__triangleborder'>
            <div className='folder__header__triangleborder__triangle' />
          </div>

          <div className='folder__header__icon'>
            <i className={classnames('fa fa-fw', {'fa-folder-open-o': this.state.open, 'fa-folder-o': !this.state.open})} />
          </div>

          <div className='folder__header__name'>
            { folderData.title }
          </div>

          <div className='folder__header__button'>

            <div className='folder__header__button__addbtn'>
              <button className='addbtn__text btn btn-outline-primary dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                {t('Folder.create')} ...
              </button>

              {/* @TODO generate the subdropdown with available app from redux */}

              <div className='addbtn__subdropdown dropdown-menu' aria-labelledby='dropdownMenuButton'>
                <div className='subdropdown__link dropdown-item' onClick={e => this.handleClickCreateContent(e, folderData, 'folder')}>
                  <div className='subdropdown__link__folder d-flex align-items-center'>
                    <div className='subdropdown__link__folder__icon mr-3'>
                      <i className='fa fa-fw fa-folder-o' />
                    </div>
                    <div className='subdropdown__link__folder__text'>
                      Créer un dossier
                    </div>
                  </div>
                </div>
                <div className='subdropdown__link dropdown-item' onClick={e => this.handleClickCreateContent(e, folderData, 'PageHtml')}>
                  <div className='subdropdown__link__apphtml d-flex align-items-center'>
                    <div className='subdropdown__link__apphtml__icon mr-3'>
                      <i className='fa fa-fw fa-file-text-o' />
                    </div>
                    <div className='subdropdown__link__apphtml__text'>
                      Rédiger un document
                    </div>
                  </div>
                </div>
                <div className='subdropdown__link dropdown-item' onClick={e => this.handleClickCreateContent(e, folderData, 'File')}>
                  <div className='subdropdown__link__appfile d-flex align-items-center'>
                    <div className='subdropdown__link__appfile__icon mr-3'>
                      <i className='fa fa-fw fa-file-image-o' />
                    </div>
                    <div className='subdropdown__link__appfile__text'>
                      Importer un fichier
                    </div>
                  </div>
                </div>
                <div className='subdropdown__link dropdown-item' onClick={e => this.handleClickCreateContent(e, folderData, 'PageMarkdown')}>
                  <div className='subdropdown__link__appmarkdown d-flex align-items-center'>
                    <div className='subdropdown__link__appmarkdown__icon mr-3'>
                      <i className='fa fa-fw fa-file-code-o' />
                    </div>
                    <div className='subdropdown__link__appmarkdown__text'>
                      Rédiger un document markdown
                    </div>
                  </div>
                </div>
                <div className='subdropdown__link dropdown-item' onClick={e => this.handleClickCreateContent(e, folderData, 'Thread')}>
                  <div className='subdropdown__link__appthread d-flex align-items-center'>
                    <div className='subdropdown__link__appthread__icon mr-3'>
                      <i className='fa fa-fw fa-comments-o' />
                    </div>
                    <div className='subdropdown__link__appthread__text'>
                      Lancer une discussion
                    </div>
                  </div>
                </div>
                <div className='subdropdown__link dropdown-item' onClick={e => this.handleClickCreateContent(e, folderData, 'Task')}>
                  <div className='subdropdown__link__apptask d-flex align-items-center'>
                    <div className='subdropdown__link__apptask__icon mr-3'>
                      <i className='fa fa-fw fa-list-ul' />
                    </div>
                    <div className='subdropdown__link__apptask__text'>
                      Créer une tâche
                    </div>
                  </div>
                </div>
                <div className='subdropdown__link dropdown-item' onClick={e => this.handleClickCreateContent(e, folderData, 'Issue')}>
                  <div className='subdropdown__link__appissue d-flex align-items-center'>
                    <div className='subdropdown__link__appissue__icon mr-3'>
                      <i className='fa fa-fw fa-ticket' />
                    </div>
                    <div className='subdropdown__link__appissue__text'>
                      Ouvrir un ticket
                    </div>
                  </div>
                </div>
              </div>

              <div className='d-none d-md-flex'>
                <BtnExtandedAction onClickExtendedAction={{
                  edit: e => onClickExtendedAction.edit(e, folderData),
                  move: e => onClickExtendedAction.move(e, folderData),
                  download: e => onClickExtendedAction.download(e, folderData),
                  archive: e => onClickExtendedAction.archive(e, folderData),
                  delete: e => onClickExtendedAction.delete(e, folderData)
                }} />
              </div>

            </div>
          </div>

          <div className='folder__header__status' />

        </div>

        <div className='folder__content'>
          { folderData.content.map((c, i) => c.type === 'folder'
            ? <Folder
              app={app}
              folderData={c}
              onClickItem={onClickItem}
              onClickExtendedAction={onClickExtendedAction}
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
              onClickExtendedAction={{
                // we have to use the event here because it is the only place where we also have the content (c)
                edit: e => onClickExtendedAction.edit(e, c),
                move: e => onClickExtendedAction.move(e, c),
                download: e => onClickExtendedAction.download(e, c),
                archive: e => onClickExtendedAction.archive(e, c),
                delete: e => onClickExtendedAction.delete(e, c)
              }}
              isLast={isLast && i === folderData.content.length - 1}
              key={c.id}
            />
          )}
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
