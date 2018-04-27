import React from 'react'
import classnames from 'classnames'

const Thread = props => {
  return (
    <div className='wsContentThread__app'>
      <ul className='wsContentThread__app__messagelist wsContentGeneric__messagelist'>
        { props.listMessage.map(msg =>
          <li className={classnames('wsContentThread__app__messagelist__item', 'wsContentGeneric__messagelist__item', {
            'sended': props.loggedUser.id === msg.author.id,
            'received': !(props.loggedUser.id === msg.author.id)
          })} key={msg.id}>
            <div className='wsContentThread__app__messagelist__item__avatar wsContentGeneric__messagelist__item__avatar'>
              <img src={msg.author.avatar} alt='avatar' />
            </div>

            <div className='wsContentThread__app__messagelist__item__createhour wsContentGeneric__messagelist__item__createhour'>
              {msg.createdAt.day} à {msg.createdAt.hour}
            </div>

            <div className='wsContentThread__app__messagelist__item__content wsContentGeneric__messagelist__item__content'>
              {msg.text}
            </div>
          </li>
        )}
      </ul>

      <form className='wsContentThread__app__texteditor wsContentGeneric__texteditor d-flex align-items-center justify-content-between flex-wrap'>
        <div className='wsContentThread__app__texteditor__textinput wsContentGeneric__texteditor__textinput'>
          <textarea placeholder='Taper votre message ici'/>
        </div>

        <div className='wsContentThread__app__texteditor__wrapper'>

          <div className='wsContentThread__app__texteditor__advancedtext wsContentGeneric__texteditor__advancedtext mb-2'>
            <button type='button' className='wsContentThread__app__texteditor__advancedtext__btn wsContentGeneric__texteditor__advancedtext__btn btn btn-outline-primary'>
              Texte Avancé
            </button>
          </div>

          <div className='wsContentThread__app__texteditor__submit wsContentGeneric__texteditor__submit mb-2'>
            <button type='submit' className='wsContentThread__app__texteditor__submit__btn wsContentGeneric__texteditor__submit__btn btn btn-primary'>
              Envoyer
              <div className='wsContentThread__app__texteditor__submit__btn__icon wsContentGeneric__texteditor__submit__btn__icon ml-3'>
                <i className='fa fa-paper-plane-o' />
              </div>
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}

export default Thread
