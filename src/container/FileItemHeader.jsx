import React, { Component } from 'react'

class FileItemHeader extends Component {
  render () {
    return (
      <div className='fileitemheader'>
        <div className='col-2 col-sm-2 col-md-2 col-lg-2 col-xl-1'>
          <div className='fileitemheader__type'>
            Type
          </div>
        </div>
        <div className='col-8 col-sm-8 col-md-8 col-lg-8 col-xl-10'>
          <div className='fileitemheader__name'>
            Nom du document ou fichier
          </div>
        </div>
        <div className='col-2 col-sm-2 col-md-2 col-lg-2 col-xl-1'>
          <div className='fileitemheader__status'>
            Statut
          </div>
        </div>
      </div>
    )
  }
}

export default FileItemHeader
