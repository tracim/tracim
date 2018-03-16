import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import FileItem from './FileItem.jsx'

// @TODO set Folder as a component, state open will come from parent container (which will come from redux) // update: or not ?

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

  handleClickNewFile = e => {
    e.stopPropagation() // because we have a link inside a link (togler and newFile)
    console.log('new file') // @TODO
  }

  render () {
    const { app, folderData: { title, content }, onClickItem, onClickFolder, isLast, t } = this.props

    return (
      <div className={classnames('folder', {'active': this.state.open, 'item-last': isLast})}>
        <div className='folder__header' onClick={this.handleClickToggleFolder}>
          <div className='folder__header__triangleborder'>
            <div className='folder__header__triangleborder__triangle' />
          </div>
          <div className='folder__header__name'>
            <div className='folder__header__name__icon'>
              <i className={classnames('fa', {'fa-folder-open-o': this.state.open, 'fa-folder-o': !this.state.open})} />
            </div>
            <div className='folder__header__name__text'>
              { title }
            </div>
            <div className='folder__header__name__addbtn' onClick={this.handleClickNewFile}>
              <div className='folder__header__name__addbtn__text btn btn-primary'>
                {t('Folder.create')} ...
              </div>
            </div>
          </div>
          <div className='folder__header__contenttype'>
            <div className='folder__header__contenttype__text'>
              {t('Folder.content_type')} :
            </div>
            <div className='folder__header__contenttype__icon'>
              <i className='fa fa-list-ul' />
              <i className='fa fa-file-text-o' />
              <i className='fa fa-comments' />
            </div>
          </div>
        </div>

        <div className='folder__content'>
          { content.map((c, i) => c.type === 'folder'
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
              isLast={isLast && i === content.length - 1}
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
