import React, { Component } from 'react'
import classnames from 'classnames'
import imgProfil from '../img/img_profil.png'

class Chat extends Component {
  render () {
    return (
      <div className={classnames('wsFileChat wsFileGeneric', {'visible': this.props.visible})}>
        <div className='wsFileChat__header wsFileGeneric__header'>
          <div className='wsFileGeneric__header__icon'>
            <i className='fa fa-comments' />
          </div>
          <div className='wsFileGeneric__header__text mr-auto'>
            Discussions à propos du nouveau système de facturation
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
        <div className='wsFileChat__wrapper wsFileGeneric__wrapper'>
          <ul className='wsFileChat__messagelist wsFileGeneric__messagelist'>

            <li className='wsFileChat__messagelist__item wsFileGeneric__messagelist__item sended'>
              <div className='wsFileGeneric__messagelist__item__avatar'>
                <img src={imgProfil} alt='avatar' />
              </div>
              <div className='wsFileGeneric__messagelist__item__createhour'>
                27/11/17 à 11h45
              </div>
              <div className='wsFileChat__messagelist__item__content wsFileGeneric__messagelist__item__content'>
                Proident esse laboris in sed officia exercitation ut anim ea.
              </div>
            </li>

            <li className='wsFileGeneric__messagelist__item received'>
              <div className='wsFileGeneric__messagelist__item__avatar'>
                <img src={imgProfil} alt='avatar' />
              </div>
              <div className='wsFileGeneric__messagelist__item__createhour'>
                27/11/17 à 11h47
              </div>
              <div className='wsFileChat__messagelist__item__content wsFileGeneric__messagelist__item__content'>
                Proident esse laboris in sed officia exercitation ut anim ea.
                Proident esse laboris in sed officia exercitation ut anim ea.
                Proident esse laboris in sed officia exercitation ut anim ea.
                Proident esse laboris in sed officia exercitation ut anim ea.
                Proident esse laboris in sed officia exercitation ut anim ea.
              </div>
            </li>

            <li className='wsFileGeneric__messagelist__item sended'>
              <div className='wsFileGeneric__messagelist__item__avatar'>
                <img src={imgProfil} alt='avatar' />
              </div>
              <div className='wsFileGeneric__messagelist__item__createhour'>
                27/11/17 à 11h45
              </div>
              <div className='wsFileChat__messagelist__item__content wsFileGeneric__messagelist__item__content'>
                Proident esse laboris in sed officia exercitation ut anim ea.
              </div>
            </li>

            <li className='wsFileGeneric__messagelist__item sended'>
              <div className='wsFileGeneric__messagelist__item__avatar'>
                <img src={imgProfil} alt='avatar' />
              </div>
              <div className='wsFileGeneric__messagelist__item__createhour'>
                27/11/17 à 11h45
              </div>
              <div className='wsFileChat__messagelist__item__content wsFileGeneric__messagelist__item__content'>
                Proident esse laboris in sed officia exercitation ut anim ea.
              </div>
            </li>

            <li className='wsFileGeneric__messagelist__item received'>
              <div className='wsFileGeneric__messagelist__item__avatar'>
                <img src={imgProfil} alt='avatar' />
              </div>
              <div className='wsFileGeneric__messagelist__item__createhour'>
                27/11/17 à 11h47
              </div>
              <div className='wsFileChat__messagelist__item__content wsFileGeneric__messagelist__item__content'>
                Proident esse laboris in sed officia exercitation ut anim ea.
                Proident esse laboris in sed officia exercitation ut anim ea.
                Proident esse laboris in sed officia exercitation ut anim ea.
                Proident esse laboris in sed officia exercitation ut anim ea.
                Proident esse laboris in sed officia exercitation ut anim ea.
              </div>
            </li>

            <li className='wsFileGeneric__messagelist__item received'>
              <div className='wsFileGeneric__messagelist__item__avatar'>
                <img src={imgProfil} alt='avatar' />
              </div>
              <div className='wsFileGeneric__messagelist__item__createhour'>
                27/11/17 à 11h47
              </div>
              <div className='wsFileChat__messagelist__item__content wsFileGeneric__messagelist__item__content'>
                Proident esse laboris in sed officia exercitation ut anim ea.
                Proident esse laboris in sed officia exercitation ut anim ea.
                Proident esse laboris in sed officia exercitation ut anim ea.
                Proident esse laboris in sed officia exercitation ut anim ea.
                Proident esse laboris in sed officia exercitation ut anim ea.
              </div>
            </li>

            <li className='wsFileGeneric__messagelist__item sended'>
              <div className='wsFileGeneric__messagelist__item__avatar'>
                <img src={imgProfil} alt='avatar' />
              </div>
              <div className='wsFileGeneric__messagelist__item__createhour'>
                27/11/17 à 11h45
              </div>
              <div className='wsFileChat__messagelist__item__content wsFileGeneric__messagelist__item__content'>
                Proident esse laboris in sed officia exercitation ut anim ea.
              </div>
            </li>

            <li className='wsFileGeneric__messagelist__item received'>
              <div className='wsFileGeneric__messagelist__item__avatar'>
                <img src={imgProfil} alt='avatar' />
              </div>
              <div className='wsFileGeneric__messagelist__item__createhour'>
                27/11/17 à 11h47
              </div>
              <div className='wsFileChat__messagelist__item__content wsFileGeneric__messagelist__item__content'>
                Proident esse laboris in sed officia exercitation ut anim ea.
                Proident esse laboris in sed officia exercitation ut anim ea.
                Proident esse laboris in sed officia exercitation ut anim ea.
                Proident esse laboris in sed officia exercitation ut anim ea.
                Proident esse laboris in sed officia exercitation ut anim ea.
              </div>
            </li>

            <li className='wsFileGeneric__messagelist__item sended'>
              <div className='wsFileGeneric__messagelist__item__avatar'>
                <img src={imgProfil} alt='avatar' />
              </div>
              <div className='wsFileGeneric__messagelist__item__createhour'>
                27/11/17 à 11h45
              </div>
              <div className='wsFileChat__messagelist__item__content wsFileGeneric__messagelist__item__content'>
                Proident esse laboris in sed officia exercitation ut anim ea.
              </div>
            </li>

          </ul>
          <form className='wsFileChat__texteditor wsFileGeneric__texteditor'>
            <div className='wsFileChat__texteditor__simpletext wsFileGeneric__texteditor__simpletext input-group'>
              <input type='text' className='wsFileChat__texteditor__simpletext__input wsFileGeneric__texteditor__simpletext__input form-control' placeholder='...' />
              <div className='wsFileChat__texteditor__simpletext__icon wsFileGeneric__texteditor__simpletext__icon input-group-addon'>
                <i className='fa fa-font' />
              </div>
            </div>
            <div className='wsFileGeneric__texteditor__wysiwyg d-none d-xl-block'>
              <textarea />
            </div>
            <div className='wsFileChat__texteditor__submit wsFileGeneric__texteditor__submit d-xl-flex justify-content-xl-center'>
              <button type='submit' className='wsFileChat__texteditor__submit__btn wsFileGeneric__texteditor__submit__btn btn btn-primary'>Envoyer
                <div className='wsFileChat__texteditor__submit__btn__icon wsFileGeneric__texteditor__submit__btn__icon'>
                  <i className='fa fa-paper-plane-o' />
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }
}

export default Chat
