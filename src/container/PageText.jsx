import React, { Component } from 'react'
import classnames from 'classnames'
import imgProfilOrange from '../img/imgProfil_orange.png'
import imgProfilReverse from '../img/imgProfil_reverse.png'

class PageText extends Component {
  render () {
    return (
      <div className={classnames('wsFileText wsFileGeneric', {'visible': this.props.visible})}>
        <div className='wsFileText__header wsFileGeneric__header'>
          <div className='wsFileGeneric__header__icon'>
            <i className='fa fa-file-text-o' />
          </div>
          <div className='wsFileText__header__title wsFileGeneric__header__title mr-auto'>
            Facture 57840 - Jean-michel Chevalier - 04/09/2017
          </div>
          <div className='wsFileGeneric__header__close'>
            <i className='fa fa-times' />
          </div>
        </div>
        <div className='wsFileGeneric__option'>
          <div className='wsFileGeneric__option__menu'>
            <div className='wsFileGeneric__option__menu__action'>
              <i className='fa fa-pencil' />
            </div>
            <div className='wsFileGeneric__option__menu__action'>
              <i className='fa fa-archive' />
            </div>
            <div className='wsFileGeneric__option__menu__action'>
              <i className='fa fa-trash' />
            </div>
          </div>
        </div>
        <div className='wsFileText__contentpage wsFileGeneric__contentpage'>
          <div className='wsFileText__contentpage__textnote'>
            <div className='wsFileText__contentpage__textnote__latestversion'>
              Dernière version : v3
            </div>
            <div className='wsFileText__contentpage__textnote__title'>
              Titre de 30px de font size
            </div>
            <div className='wsFileText__contentpage__textnote__data'>
              Labore tempor sunt id quis quis velit ut officia amet ut
              adipisicing in in commodo exercitation cupidatat culpa
              eiusmo dolor consectetur dolor ut proident proident culpamet
              denim consequat in sit ex ullamco duis.
              <br />
              Labore tempor sunt id quis quis velit ut officia amet ut
              adipisicing in in commodo exercitation cupidatat culpa
              eiusmo dolor consectetur dolor ut proident proident culpamet
              denim consequat in sit ex ullamco duis.
              <br />
              Labore tempor sunt id quis quis velit ut officia amet ut
              adipisicing in in commodo exercitation cupidatat culpa
              eiusmo dolor consectetur dolor ut proident proident culpamet
              denim consequat in sit ex ullamco duis.
              <br />
              Labore tempor sunt id quis quis velit ut officia amet ut
              adipisicing in in commodo exercitation cupidatat culpa
              eiusmo dolor consectetur dolor ut proident proident culpamet
              denim consequat in sit ex ullamco duis.
            </div>
          </div>
          <div className='wsFileText__contentpage__wrapper wsFileGeneric__wrapper'>
            <div className='wsFileText__contentpage__header'>
              Timeline
            </div>

            <ul className='wsFileText__contentpage__messagelist wsFileGeneric__messagelist'>

              <li className='wsFileText__contentpage__messagelist__item wsFileGeneric__messagelist__item sended'>
                <div className='wsFileText__contentpage__messagelist__item__avatar wsFileGeneric__messagelist__item__avatar'>
                  <img src={imgProfilOrange} alt='avatar' />
                </div>
                <div className='wsFileText__contentpage__messagelist__item__createhour wsFileGeneric__messagelist__item__createhour'>
                  27/11/17 à 11h45
                </div>
                <div className='wsFileText__contentpage__messagelist__item__content wsFileGeneric__messagelist__item__content'>
                  Proident esse laboris in sed officia exercitation ut anim ea.
                </div>
              </li>

              <li className='wsFileText__contentpage__messagelist__item wsFileGeneric__messagelist__item received'>
                <div className='wsFileText__contentpage__messagelist__item__avatar wsFileGeneric__messagelist__item__avatar'>
                  <img src={imgProfilReverse} alt='avatar' />
                </div>
                <div className='wsFileText__contentpage__messagelist__item__createhour wsFileGeneric__messagelist__item__createhour'>
                  27/11/17 à 11h47
                </div>
                <div className='wsFileText__contentpage__messagelist__item__content wsFileGeneric__messagelist__item__content'>
                  Proident esse laboris in sed officia exercitation ut anim ea.
                  Proident esse laboris in sed officia exercitation ut anim ea.
                  Proident esse laboris in sed officia exercitation ut anim ea.
                  Proident esse laboris in sed officia exercitation ut anim ea.
                  Proident esse laboris in sed officia exercitation ut anim ea.
                </div>
              </li>

              <div className='wsFileText__contentpage__messagelist__version wsFileGeneric__messagelist__version'>
                <div className='wsFileText__contentpage__messagelist__version__btn btn-primary'>
                  <i className='fa fa-code-fork' />
                  version 3
                </div>
                <div className='wsFileText__contentpage__messagelist__version__dateversion'>
                  Créer le 22/11/17
                </div>
              </div>

              <li className='wsFileText__contentpage__messagelist__item wsFileGeneric__messagelist__item sended'>
                <div className='wsFileText__contentpage__messagelist__item__avatar wsFileGeneric__messagelist__item__avatar'>
                  <img src={imgProfilOrange} alt='avatar' />
                </div>
                <div className='wsFileText__contentpage__messagelist__item__createhour wsFileGeneric__messagelist__item__createhour'>
                  27/11/17 à 11h45
                </div>
                <div className='wsFileText__contentpage__messagelist__item__content wsFileGeneric__messagelist__item__content'>
                  Proident esse laboris in sed officia exercitation ut anim ea.
                </div>
              </li>

              <li className='wsFileText__contentpage__messagelist__item wsFileGeneric__messagelist__item received'>
                <div className='wsFileText__contentpage__messagelist__item__avatar wsFileGeneric__messagelist__item__avatar'>
                  <img src={imgProfilReverse} alt='avatar' />
                </div>
                <div className='wsFileText__contentpage__messagelist__item__createhour wsFileGeneric__messagelist__item__createhour'>
                  27/11/17 à 11h47
                </div>
                <div className='wsFileText__contentpage__messagelist__item__content wsFileGeneric__messagelist__item__content'>
                  Proident esse laboris in sed officia exercitation ut anim ea.
                  Proident esse laboris in sed officia exercitation ut anim ea.
                  Proident esse laboris in sed officia exercitation ut anim ea.
                  Proident esse laboris in sed officia exercitation ut anim ea.
                  Proident esse laboris in sed officia exercitation ut anim ea.
                </div>
              </li>

            </ul>
            <form className='wsFileText__contentpage__texteditor wsFileGeneric__texteditor'>
              <div className='wsFileText__contentpage__texteditor__simpletext wsFileGeneric__texteditor__simpletext input-group'>
                <input type='text' className='wsFileText__contentpage__texteditor__simpletext__input wsFileGeneric__texteditor__simpletext__input form-control' placeholder='...' />
                <div className='wsFileText__contentpage__texteditor__simpletext__icon wsFileGeneric__texteditor__simpletext__icon input-group-addon'>
                  <i className='fa fa-font' />
                </div>
              </div>
              <div className='wsFileText__contentpage__texteditor__wysiwyg wsFileGeneric__texteditor__wysiwyg d-none d-xl-block'>
                <textarea />
              </div>
              <div className='wsFileText__contentpage__texteditor__submit wsFileGeneric__texteditor__submit d-xl-flex justify-content-xl-center'>
                <button type='submit' className='wsFileText__contentpage__texteditor__submit__btn wsFileGeneric__texteditor__submit__btn btn btn-primary'>Envoyer
                  <div className='wsFileText__contentpage__texteditor__submit__btn__icon wsFileGeneric__texteditor__submit__btn__icon'>
                    <i className='fa fa-paper-plane-o' />
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }
}

export default PageText
