import React from 'react'
import PropTypes from 'prop-types'
// import CardPopup from '../common/CardPopup/CardPopup.jsx'
import { CardPopup } from 'tracim_frontend_lib'
import GenericContent from './ContentType/GenericContent.jsx'
import FileContent from './ContentType/FileContent.jsx'
import WsContent from './ContentType/WsContent.jsx'

require('./PopupCreateContainer.styl')

console.log('cardPopp', CardPopup)
console.log('Warning: PopupCreateContainer is deprecated')

const PopupCreateContainer = props => {
  const FormCreateContent = (() => {
    switch (props.type) {
      case 'Workspace':
        return <WsContent />
      case 'File':
        return <FileContent />
      case 'folder':
        return <GenericContent />
      default:
        return <GenericContent />
    }
  })()

  // return (
  //   <div className='popupcontent'>
  //     <div className='popupcontent__container card'>
  //       <div className='popupcontent__container__header' />
  //       <div className='card-body nopadding'>
  //         { FormCreateContent }
  //       </div>
  //     </div>
  //   </div>
  // )
  return (
    <CardPopup customClass='popupCreateContent' onClose={props.onClose}>
      {FormCreateContent}
    </CardPopup>
  )
}

export default PopupCreateContainer

PopupCreateContainer.propTypes = {
  type: PropTypes.string.isRequired,
  folder: PropTypes.object,
  onClose: PropTypes.func.isRequired
}
