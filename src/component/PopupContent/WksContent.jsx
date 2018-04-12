import React, { Component } from 'react'

class wksContent extends Component {
  render () {
    return (
      <div className='wkscontent p-3'>
        <div className='wkscontent__close d-flex justify-content-end'>
          <i className='fa fa-times' />
        </div>
        <div className='wkscontent__contentname d-flex align-items-center mb-4'>
          <div className='wkscontent__contentname__title'>
            Création d'un espace de travail
          </div>
        </div>
        <form className='wkscontent__form'>
          <div className='wkscontent__form__input mb-2'>
            <input type='text' placeholder='Titre du document' />
          </div>
          <div className='wkscontent__form__button d-flex justify-content-end p-3'>
            <button className='wkscontent__form__button btn btn-outline-primary' type='submit'>
              Créer et Valider
            </button>
          </div>
        </form>
      </div>
    )
  }
}

export default wksContent
