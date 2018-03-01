import React, { Component } from 'react'
import ProgressBar from './ProgressBar.jsx'

class UploadPopup extends Component {
  render () {
    return (
      <div className='uploadpopup'>
        <div className='uploadpopup__wrapper card'>
          <div className='card-body'>

            <div className='uploadpopup__closepopup'>
              <i className='fa fa-times' />
            </div>

            <div className='uploadpopup__progress'>
              <div className='uploadpopup__progress__bar'>
                <ProgressBar />
              </div>

              <div className='uploadpopup__progress__filename'>
                Nom du Fichier
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default UploadPopup
