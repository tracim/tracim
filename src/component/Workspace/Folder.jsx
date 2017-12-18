import React, { Component } from 'react'
// import PropTypes from 'prop-types'
// import classnames from 'classnames'

// @TODO set Folder as a component, state open will come from parent container (which will come from redux)

class Folder extends Component {
  constructor (props) {
    super(props)
    this.state = {
      open: false
    }
    this.handleClickToggleFolder = this.handleClickToggleFolder.bind(this)
  }

  handleClickToggleFolder = () => this.setState({open: !this.state.open})
  handleClickNewFile = e => {
    e.stopPropagation() // because we have a link inside a link (togler and newFile)
    console.log('new file') // @TODO
  }

  render () {
    return (
      <div className={'folder' + (this.state.open ? ' active' : '')}>
        <div className='folder__header' onClick={this.handleClickToggleFolder}>
          <div className='folder__header__triangleborder'>
            <div className='folder__header__triangleborder__triangle' />
          </div>
          <div className='folder__header__name'>
            <div className='folder__header__name__icon'>
              <i className='fa fa-folder-open-o' />
            </div>
            <div className='folder__header__name__text'>
              Dossier Facture
            </div>
            <div className='folder__header__name__addbtn' onClick={this.handleClickNewFile}>
              <div className='folder__header__name__addbtn__text btn btn-primary'>
                créer ...
              </div>
            </div>
          </div>
          <div className='folder__header__contenttype'>
            <div className='folder__header__contenttype__text'>
              Type de Contenu :
            </div>
            <div className='folder__header__contenttype__icon'>
              <i className='fa fa-list-ul' />
              <i className='fa fa-file-text-o' />
              <i className='fa fa-comments' />
            </div>
          </div>
        </div>

        <div className='folder__content'>
          { this.props.children }
        </div>
      </div>
    )
  }
}

export default Folder
