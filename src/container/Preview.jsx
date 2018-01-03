import React, { Component } from 'react'
import classnames from 'classnames'
import Timeline from '../component/Timeline.jsx'
import imgPDF from '../img/pdf.jpg'
// import imgExcel from '../img/excel.png'

class Preview extends Component {
  render () {
    return (
      <div className={classnames('wsFilePreview wsFileGeneric', {'visible': this.props.visible})}>
        <div className='wsFilePreview__header wsFileGeneric__header'>
          <div className='wsFileGeneric__header__icon'>
            <i className='fa fa-file-image-o' />
          </div>
          <div className='wsFilePreview__header__title wsFileGeneric__header__title mr-auto'>
            Planning d'intégration de l'application tracim
          </div>
          <div className='wsFileGeneric__header__edittitle'>
            <i className='fa fa-pencil' />
          </div>
          <div className='wsFileGeneric__header__close'>
            <i className='fa fa-times' />
          </div>
        </div>
        <div className='wsFileGeneric__option'>
          <div className='wsFilePreview__option__menu wsFileGeneric__option__menu'>
            <div className='wsFilePreview__option__menu__addversion btn mr-auto'>
              Nouvelle version
              <i className='fa fa-plus-circle' />
            </div>
            <div className='wsFileGeneric__option__menu__status dropdown'>
              <button className='wsFileGeneric__option__menu__status__dropdownbtn check btn dropdown-toggle' type='button' id='dropdownMenu2' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                Validé
                <div className='wsFileGeneric__option__menu__status__dropdownbtn__icon'>
                  <i className='fa fa-check' />
                </div>
              </button>
              <div className='wsFileGeneric__option__menu__status__submenu dropdown-menu' aria-labelledby='dropdownMenu2'>
                <h6 className='dropdown-header'>Statut du fichier</h6>
                <div className='dropdown-divider' />
                <button className='wsFileGeneric__option__menu__status__submenu__item current  dropdown-item' type='button'>
                  En cours
                  <div className='wsFileGeneric__option__menu__status__submenu__item__icon'>
                    <i className='fa fa-gears' />
                  </div>
                </button>
                <button className='wsFileGeneric__option__menu__status__submenu__item check dropdown-item' type='button'>
                  Validé
                  <div className='wsFileGeneric__option__menu__status__submenu__item__icon'>
                    <i className='fa fa-check' />
                  </div>
                </button>
                <button className='wsFileGeneric__option__menu__status__submenu__item invalid dropdown-item' type='button'>
                  Invalidé
                  <div className='wsFileGeneric__option__menu__status__submenu__item__icon'>
                    <i className='fa fa-times' />
                  </div>
                </button>
                <button className='wsFileGeneric__option__menu__status__submenu__item ban dropdown-item' type='button'>
                  Obsolète
                  <div className='wsFileGeneric__option__menu__status__submenu__item__icon'>
                    <i className='fa fa-ban' />
                  </div>
                </button>
              </div>
            </div>
            <div className='wsFileGeneric__option__menu__action'>
              <i className='fa fa-archive' />
            </div>
            <div className='wsFileGeneric__option__menu__action'>
              <i className='fa fa-trash' />
            </div>
          </div>
        </div>
        <div className='wsFilePreview__contentpage wsFileGeneric__contentpage'>

          <div className='wsFilePreview__contentpage__visualizer'>
            <div className='wsFilePreview__contentpage__visualizer__dloption'>
              <div className='wsFilePreview__contentpage__visualizer__dloption__icon'>
                <i className='fa fa-download' />
              </div>
              <div className='wsFilePreview__contentpage__visualizer__dloption__icon'>
                <i className='fa fa-file-pdf-o' />
              </div>
              <div className='wsFilePreview__contentpage__visualizer__dloption__icon'>
                <i className='fa fa-files-o' />
              </div>
            </div>
            <div className='wsFilePreview__contentpage__visualizer__slidecontainer'>
              <div className='wsFilePreview__contentpage__visualizer__slidecontainer__chevron'>
                <i className='fa fa-chevron-left' />
              </div>
              <div className='wsFilePreview__contentpage__visualizer__slidecontainer__fileimg'>
                <img src={imgPDF} alt='fichier pdf' className='d-block img-thumbnail rounded m-auto' />
              </div>
              <div className='wsFilePreview__contentpage__visualizer__slidecontainer__chevron'>
                <i className='fa fa-chevron-right' />
              </div>
            </div>
            <div className='wsFilePreview__contentpage__visualizer__sidebar'>
              <div className='wsFilePreview__contentpage__visualizer__sidebar__visiblepart'>
                <div className='wsFilePreview__contentpage__visualizer__sidebar__visiblepart__icon'>
                  <i className='fa fa-gear' />
                </div>
                <div className='wsFilePreview__contentpage__visualizer__sidebar__visiblepart__title'>
                  Propriétés
                </div>
              </div>
              <div className='wsFilePreview__contentpage__visualizer__sidebar__propertydetail'>
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

          <Timeline customClass={'wsFilePreview__contentpage'} />

        </div>
      </div>
    )
  }
}

export default Preview
