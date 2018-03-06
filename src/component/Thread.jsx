import React from 'react'
import classnames from 'classnames'

const Thread = props => {
  return (
    <div className='wsContentThread'>
      <ul className='wsContentThread__messagelist wsFileGeneric__messagelist'>
        { props.listMessage.map(msg =>
          <li className={classnames('wsContentThread__messagelist__item', 'wsFileGeneric__messagelist__item', {
            'sended': props.loggedUser.id === msg.author.id,
            'received': !(props.loggedUser.id === msg.author.id)
          })} key={msg.id}>
            <div className='wsContentThread__messagelist__item__avatar wsFileGeneric__messagelist__item__avatar'>
              <img src={msg.author.avatar} alt='avatar' />
            </div>

            <div className='wsContentThread__messagelist__item__createhour wsFileGeneric__messagelist__item__createhour'>
              {msg.createdAt.day} à {msg.createdAt.hour}
            </div>

            <div className='wsContentThread__messagelist__item__content wsFileGeneric__messagelist__item__content'>
              {msg.text}
            </div>
          </li>
        )}
      </ul>

      <form className='wsContentThread__texteditor wsFileGeneric__texteditor'>
        <div className='wsContentThread__texteditor__simpletext wsFileGeneric__texteditor__simpletext input-group'>
          <input type='text' className='wsContentThread__texteditor__simpletext__input wsFileGeneric__texteditor__simpletext__input form-control' placeholder='...' />

          <div className='wsContentThread__texteditor__simpletext__icon wsFileGeneric__texteditor__simpletext__icon input-group-addon'>
            <i className='fa fa-font' />
          </div>
        </div>

        <div className='wsFileGeneric__texteditor__wysiwyg d-none d-xl-block'>
          <textarea />
        </div>

        <div className='wsContentThread__texteditor__submit wsFileGeneric__texteditor__submit d-xl-flex justify-content-xl-center'>
          <button type='submit' className='wsContentThread__texteditor__submit__btn wsFileGeneric__texteditor__submit__btn btn btn-primary'>
            Envoyer
            <div className='wsContentThread__texteditor__submit__btn__icon wsFileGeneric__texteditor__submit__btn__icon'>
              <i className='fa fa-paper-plane-o' />
            </div>
          </button>
        </div>
      </form>
    </div>
  )
}

export default Thread
