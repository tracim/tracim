import React from 'react'
import classnames from 'classnames'
import imgProfilOrange from '../img/imgProfil_orange.png'
import imgProfilReverse from '../img/imgProfil_reverse.png'

const Timeline = props => {
  return (
    <div className='timeline'>
      <div className={classnames(`${props.customClass}__header`, 'timeline__header')}>
        Timeline
      </div>

      <ul className={classnames(`${props.customClass}__messagelist`, 'timeline__messagelist')}>

        <li className={classnames(`${props.customClass}__messagelist__item`, 'timeline__messagelist__item sended')}>
          <div className={classnames(`${props.customClass}__messagelist__item__avatar`, 'timeline__messagelist__item__avatar')}>
            <img src={imgProfilOrange} alt='avatar' />
          </div>
          <div
            className={classnames(`${props.customClass}__messagelist__item__createhour`, 'timeline__messagelist__item__createhour')}>
            27/11/17 à 11h45
          </div>
          <div
            className={classnames(`${props.customClass}__messagelist__item__content`, 'timeline__messagelist__item__content')}>
            Proident esse laboris in sed officia exercitation ut anim ea.
          </div>
        </li>

        <li className={classnames(`${props.customClass}__messagelist__item`, 'timeline__messagelist__item received')}>
          <div className={classnames(`${props.customClass}__messagelist__item__avatar`, 'timeline__messagelist__item__avatar')}>
            <img src={imgProfilReverse} alt='avatar' />
          </div>
          <div
            className={classnames(`${props.customClass}__messagelist__item__createhour`, 'timeline__messagelist__item__createhour')}>
            27/11/17 à 11h47
          </div>
          <div
            className={classnames(`${props.customClass}__messagelist__item__content`, 'timeline__messagelist__item__content')}>
            Proident esse laboris in sed officia exercitation ut anim ea.
            Proident esse laboris in sed officia exercitation ut anim ea.
            Proident esse laboris in sed officia exercitation ut anim ea.
            Proident esse laboris in sed officia exercitation ut anim ea.
            Proident esse laboris in sed officia exercitation ut anim ea.
          </div>
        </li>

        <li className={classnames(`${props.customClass}__messagelist__version`, 'timeline__messagelist__version')}>
          <div className={classnames(`${props.customClass}__messagelist__version__btn`, 'timeline__messagelist__version__btn btn')}>
            <i className='fa fa-code-fork' />
            version 3
          </div>
          <div className={classnames(`${props.customClass}__messagelist__version__date`, 'timeline__messagelist__version__date')}>
            Créer le 22/11/17
          </div>
        </li>

        <li className={classnames(`${props.customClass}__messagelist__item`, 'timeline__messagelist__item sended')}>
          <div className={classnames(`${props.customClass}__messagelist__item__avatar`, 'timeline__messagelist__item__avatar')}>
            <img src={imgProfilOrange} alt='avatar' />
          </div>
          <div
            className={classnames(`${props.customClass}__messagelist__item__createhour`, 'timeline__messagelist__item__createhour')}>
            27/11/17 à 11h45
          </div>
          <div
            className={classnames(`${props.customClass}__messagelist__item__content`, 'timeline__messagelist__item__content')}>
            Proident esse laboris in sed officia exercitation ut anim ea.
          </div>
        </li>

        <li className={classnames(`${props.customClass}__messagelist__item`, 'timeline__messagelist__item received')}>
          <div className={classnames(`${props.customClass}__messagelist__item__avatar`, 'timeline__messagelist__item__avatar')}>
            <img src={imgProfilReverse} alt='avatar' />
          </div>
          <div
            className={classnames(`${props.customClass}__messagelist__item__createhour`, 'timeline__messagelist__item__createhour')}>
            27/11/17 à 11h47
          </div>
          <div
            className={classnames(`${props.customClass}__messagelist__item__content`, 'timeline__messagelist__item__content')}>
            Proident esse laboris in sed officia exercitation ut anim ea.
            Proident esse laboris in sed officia exercitation ut anim ea.
            Proident esse laboris in sed officia exercitation ut anim ea.
            Proident esse laboris in sed officia exercitation ut anim ea.
            Proident esse laboris in sed officia exercitation ut anim ea.
          </div>
        </li>

      </ul>
      <form className={classnames(`${props.customClass}__texteditor`, 'timeline__texteditor')}>
        <div
          className={classnames(`${props.customClass}__texteditor__simpletext`, 'timeline__texteditor__simpletext input-group')}>
          <input
            type='text'
            className={classnames(`${props.customClass}__texteditor__simpletext__input`, 'timeline__texteditor__simpletext__input form-control')}
            placeholder='...'
          />
          <div
            className={classnames(`${props.customClass}__texteditor__simpletext__icon`, 'timeline__texteditor__simpletext__icon input-group-addon')}>
            <i className='fa fa-font' />
          </div>
        </div>
        <div className={classnames(`${props.customClass}__texteditor__wysiwyg`, 'timeline__texteditor__wysiwyg d-none d-xl-block')}>
          <textarea />
        </div>
        <div className={classnames(`${props.customClass}__texteditor__submit`, 'timeline__texteditor__submit d-xl-flex justify-content-xl-center')}>
          <button
            type='submit'
            className={classnames(`${props.customClass}__texteditor__submit__btn`, 'timeline__texteditor__submit__btn btn')}
          >
            Envoyer
            <div className={classnames(`${props.customClass}__texteditor__submit__btn__icon`, 'timeline__texteditor__submit__btn__icon')}>
              <i className='fa fa-paper-plane-o' />
            </div>
          </button>
        </div>
      </form>
    </div>
  )
}

export default Timeline
