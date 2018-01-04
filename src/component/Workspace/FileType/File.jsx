import React, { Component } from 'react'
import classnames from 'classnames'
import imgPDF from '../../../img/pdf.jpg'
// import imgExcel from '../img/excel.png'

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
      <div className={classnames('wsFileFile__contentpage__visualizer', {'activesidebar': this.state.activesidebar})}>
        <div className='wsFileFile__contentpage__visualizer__dloption'>
          <div className='wsFileFile__contentpage__visualizer__dloption__icon'>
            <i className='fa fa-download' />
          </div>
          <div className='wsFileFile__contentpage__visualizer__dloption__icon'>
            <i className='fa fa-file-pdf-o' />
          </div>
          <div className='wsFileFile__contentpage__visualizer__dloption__icon'>
            <i className='fa fa-files-o' />
          </div>
        </div>
        <div className='wsFileFile__contentpage__visualizer__slidecontainer'>
          <div className='wsFileFile__contentpage__visualizer__slidecontainer__chevron'>
            <i className='fa fa-chevron-left' />
          </div>
          <div className='wsFileFile__contentpage__visualizer__slidecontainer__fileimg'>
            <img src={imgPDF} alt='fichier pdf' className='d-block img-thumbnail rounded m-auto' />
          </div>
          <div className='wsFileFile__contentpage__visualizer__slidecontainer__chevron'>
            <i className='fa fa-chevron-right' />
          </div>
        </div>
        <div className='wsFileFile__contentpage__visualizer__sidebar' onClick={this.handleClickSidebar}>
          <div className='wsFileFile__contentpage__visualizer__sidebar__visiblepart'>
            <div className='wsFileFile__contentpage__visualizer__sidebar__visiblepart__icon'>
              <i className='fa fa-gear' />
            </div>
            <div className='wsFileFile__contentpage__visualizer__sidebar__visiblepart__title'>
              Propriétés
            </div>
          </div>
          <div className='wsFileFile__contentpage__visualizer__sidebar__propertydetail'>
            Fichier : Planning Intégration de Tracim
            <br />
            Description : Fichier excel et pdf du planning
            <br />
            Taille : 50ko
            <br />
            Utilisateurs : Damien, Bastien, Côme, Phillipe
            <br />
            Date de Création : 08/07/17
            <br />
            Commentaire principale : Ce planning est voué à être modifié régulièrement par l’équipe.
            <br />
            Paramètres utilisés (optionnelle) :
            Aliqua mollit nulla velit magna velit adipisicing culpa ex dolor cupidatat eu commodo.
            <br />
            <br />
            Description : Fichier excel et pdf du planning
            <br />
            Taille : 50ko
            <br />
            Utilisateurs : Damien, Bastien, Côme, Phillipe
            <br />
            Date de Création : 08/07/17
            <br />
            Commentaire principale : Ce planning est voué à être modifié régulièrement par l’équipe.
            <br />
            Paramètres utilisés (optionnelle) :
            Aliqua mollit nulla velit magna velit adipisicing culpa ex dolor cupidatat eu commodo.
            <br />
            <br />
            Description : Fichier excel et pdf du planning
            <br />
            Taille : 50ko
            <br />
            Utilisateurs : Damien, Bastien, Côme, Phillipe
            <br />
            Date de Création : 08/07/17
            <br />
            Commentaire principale : Ce planning est voué à être modifié régulièrement par l’équipe.
            <br />
            Paramètres utilisés (optionnelle) :
            Aliqua mollit nulla velit magna velit adipisicing culpa ex dolor cupidatat eu commodo.
            <br />
          </div>
        </div>
      </div>
    )
  }
}

export default File
