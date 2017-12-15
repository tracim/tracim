import React, { Component } from 'react'

class Folder extends Component {
  constructor (props) {
    super(props)
    this.state = {
      open: false
    }
    this.handleClickToggleFolder = this.handleClickToggleFolder.bind(this)
  }

  handleClickToggleFolder = () => this.setState({open: !this.state.open})

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
            <div className='folder__header__name__addbtn'>
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
        { this.props.children }
      </div>
    )
  }
}

export default Folder
