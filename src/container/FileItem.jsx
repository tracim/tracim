import React, { Component } from 'react'

class FileItem extends Component {
  render () {
    const { type, status, customClass } = this.props

    let faClass = ''
    if (type === 'file') faClass = 'fa fa-file-text-o docandfile-color'
    else if (type === 'chat') faClass = 'fa fa-comments talk-color'
    else if (type === 'task') faClass = 'fa fa-list-ul task-color'

    let iconStatus = ''
    if (status === 'current') iconStatus = 'fa fa-cogs current-color'
    else if (status === 'nouse') iconStatus = 'fa fa-ban nouse-color'
    else if (status === 'check') iconStatus = 'fa fa-check check-color'

    let classInFolder = ''
    if (customClass === 'inFolder') classInFolder = 'inFolder'

    return (
      <div className={'fileitem__rowfile align-items-center ' + (classInFolder)} onClick={this.props.onClickElement}>
        <div className='col-2 col-sm-2 col-md-2 col-lg-2 col-xl-1'>
          <div className='fileitem__rowfile__type'>
            <i className={faClass} />
          </div>
        </div>
        <div className='col-8 col-sm-8 col-md-8 col-lg-8 col-xl-10'>
          <div className='fileitem__rowfile__name'>
            <div className='fileitem__rowfile__name__text'>
              { this.props.name }
            </div>
            <div className='fileitem__rowfile__name__icons d-none d-md-flex'>
              <div className='fileitem__rowfile__name__icons__download'>
                <i className='fa fa-download' />
              </div>
              <div className='fileitem__rowfile__name__icons__archive'>
                <i className='fa fa-archive' />
              </div>
              <div className='fileitem__rowfile__name__icons__delete'>
                <i className='fa fa-trash-o' />
              </div>
            </div>
          </div>
        </div>
        <div className='col-2 col-sm-2 col-md-2 col-lg-2 col-xl-1'>
          <div className='fileitem__rowfile__status'>
            <i className={iconStatus} />
          </div>
        </div>
      </div>
    )
  }
}

export default FileItem
