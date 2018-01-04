import React, { Component } from 'react'
import classnames from 'classnames'
import imgPDF from '../../../img/pdf.jpg'
// import imgExcel from '../../../img/excel.png'

class File extends Component {
  constructor (props) {
    super(props)
    this.state = {
      activesidebar: false
    }
  }

  handleClickSidebar = () => this.setState(prev => ({activesidebar: !prev.activesidebar}))

  render () {
    return (
      <div className={classnames('wsFileFile__contentpage__preview', {'activesidebar': this.state.activesidebar})}>
        <div className='wsFileFile__contentpage__preview__dloption'>
          <div className='wsFileFile__contentpage__preview__dloption__icon'>
            <i className='fa fa-download' />
          </div>
          <div className='wsFileFile__contentpage__preview__dloption__icon'>
            <i className='fa fa-file-pdf-o' />
          </div>
          <div className='wsFileFile__contentpage__preview__dloption__icon'>
            <i className='fa fa-files-o' />
          </div>
        </div>
        <div className='wsFileFile__contentpage__preview__slider'>
          <div className='wsFileFile__contentpage__preview__slider__icon'>
            <i className='fa fa-chevron-left' />
          </div>
          <div className='wsFileFile__contentpage__preview__slider__fileimg'>
            <img src={imgPDF} alt='fichier pdf' className='img-thumbnail mx-auto' />
          </div>
          <div className='wsFileFile__contentpage__preview__slider__icon'>
            <i className='fa fa-chevron-right' />
          </div>
        </div>
        <div className='wsFileFile__contentpage__preview__sidebar' onClick={this.handleClickSidebar}>
          <div className='wsFileFile__contentpage__preview__sidebar__button'>
            <div className='wsFileFile__contentpage__preview__sidebar__button__icon'>
              <i className='fa fa-gear' />
            </div>
            <div className='wsFileFile__contentpage__preview__sidebar__button__title'>
              Propriétés
            </div>
          </div>
          <div className='wsFileFile__contentpage__preview__sidebar__property'>
            <div className='wsFileFile__contentpage__preview__sidebar__property__detail'>
              <div className='wsFileFile__contentpage__preview__sidebar__property__detail__label'>
                  Fichier :
              </div>
              <div className='wsFileFile__contentpage__preview__sidebar__property__detail__info'>
                  Planning Intégration de Tracim
              </div>

              <div className='wsFileFile__contentpage__preview__sidebar__property__detail__label'>
                  Description :
              </div>
              <div className='wsFileFile__contentpage__preview__sidebar__property__detail__info'>
                  Fichier excel et pdf du planning
              </div>

              <div className='wsFileFile__contentpage__preview__sidebar__property__detail__label'>
                  Taille :
              </div>
              <div className='wsFileFile__contentpage__preview__sidebar__property__detail__info'>
                  500ko
              </div>

              <div className='wsFileFile__contentpage__preview__sidebar__property__detail__label'>
                  Equipe :
              </div>
              <div className='wsFileFile__contentpage__preview__sidebar__property__detail__info'>
                  Bastien, Côme, Damien, Philippe.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default File
