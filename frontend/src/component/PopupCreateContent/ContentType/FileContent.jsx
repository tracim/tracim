import React from 'react'

require('./FileContent.styl')

const FileContent = props => {
  return (
    <div className='filecontent p-3'>
      <div className='filecontent__close d-flex justify-content-end'>
        <i className='fas fa-times' />
      </div>

      <div className='filecontent__contentname d-flex align-items-center mb-4'>
        <div className='filecontent__contentname__icon mr-3'>
          <i className='fas fa-file-text-o' />
        </div>

        <div className='filecontent__contentname__title'>
          Fichier de prévisualisation
        </div>
      </div>

      <div className='filecontent__text'>Importer votre fichier :</div>

      <div className='filecontent__form mb-4' drop='true'>
        <div className='filecontent__form__icon d-flex justify-content-center'>
          <label htmlFor='filecontentUpload' type='file'>
            <i className='fas fa-download' />
          </label>

          <input type='file' className='d-none' id='filecontentUpload' />
        </div>

        <div className='filecontent__form__instruction text-center'>
          Glisser votre fichier ici
        </div>

        <div className='filecontent__form__text text-center'>
          Vous pouvez également importer votre fichier en cliquant sur l'icon
        </div>
      </div>

      <div className='filecontent__button d-flex justify-content-end'>
        <button className='filecontent__form__button btn btn-outline-primary'>
          Créer et Valider
        </button>
      </div>
    </div>
  )
}

export default FileContent
