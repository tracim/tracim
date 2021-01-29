import React from 'react'

require('./WsContent.styl')

const WsContent = props => {
  return (
    <div className='wscontent p-3'>
      <div className='wscontent__close d-flex justify-content-end'>
        <i className='fas fa-times' />
      </div>

      <div className='wscontent__contentname d-flex align-items-center mb-4'>
        <div className='wscontent__contentname__title'>
          Création d'un espace de travail
        </div>
      </div>

      <form className='wscontent__form'>
        <div className='wscontent__form__input mb-2'>
          <input type='text' placeholder='Titre du document' />
        </div>

        <div className='wscontent__form__button d-flex justify-content-end p-3'>
          <button className='wscontent__form__button btn btn-outline-primary' type='submit'>
            Créer et Valider
          </button>
        </div>
      </form>
    </div>
  )
}

export default WsContent
