import React, { Component } from 'react'
import GenericContent from '../Component/PopupContent/GenericContent.jsx'
import FileContent from '../Component/PopupContent/FileContent.jsx'
import WksContent from '../Component/PopupContent/WksContent.jsx'

class PopupCreateContainer extends Component {
  render () {
    return (
      <div className='popupcontent'>
        <div className='popupcontent__container card'>
          <div className='popupcontent__container__header' />
          <div className='card-body nopadding'>
            <FileContent />
          </div>
        </div>
      </div>
    )
  }
}

export default PopupCreateContainer
