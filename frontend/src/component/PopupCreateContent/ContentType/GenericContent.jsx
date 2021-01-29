import React from 'react'

require('./GenericContent.styl')

const GenericContent = props => {
  return (
    <div className='genericcontent p-3'>
      <div className='genericcontent__close d-flex justify-content-end'>
        <i className='fas fa-times' />
      </div>

      <div className='genericcontent__contentname d-flex align-items-center mb-4'>
        <div className='genericcontent__contentname__icon mr-3'>
          <i className='fas fa-file-word-o' />
        </div>

        <div className='genericcontent__contentname__title'>
          Fichier Texte
        </div>
      </div>

      <form className='genericcontent__form'>
        <div className='genericcontent__form__input mb-2'>
          <input type='text' placeholder='Titre du document' />
        </div>

        <div className='genericcontent__form__button d-flex justify-content-end p-3'>
          <button className='genericcontent__form__button btn btn-outline-primary' type='submit'>
            Créer et Valider
          </button>
        </div>
      </form>
    </div>
  )
}

export default GenericContent
