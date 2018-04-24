import React, { Component } from 'react'
import ContentTypeList from '../component/ExtandedActionComponent/ContentTypeList.jsx'
import BtnEditFolder from '../component/ExtandedActionComponent/BtnEditFolder.jsx'

class PopupExtandedAction extends Component {
  render () {
    return (
      <div className='card extandedaction d-none d-md-block' style={{display: this.props.openExtandedAction ? 'block' : 'none'}}>
        <div className='card-body extandedaction__content'>
          <div className='extandedaction__content__close d-flex justify-content-end' onClick={this.props.onClickCloseBtn}>
            <i className='fa fa-fw- fa-times' />
          </div>
          <div className='extandedaction__content__type'>
            <div className='extandedaction__content__type__title'>
              Type de contenu du dossier :
            </div>
            <ContentTypeList />
          </div>
          <div className='extandedaction__content__advancedfolder'>
            <div className='extandedaction__content__advancedfolder__title'>
              Activer l'édition du Dossier :
            </div>
            <BtnEditFolder />
          </div>
        </div>
      </div>
    )
  }
}

export default PopupExtandedAction
