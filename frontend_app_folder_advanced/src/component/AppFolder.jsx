import React from 'react'

const PageHtml = props => {
  return (
    <div className='appfolder__optionfolder'>
      <div className='optionfolder__typecontent'>
        <div className='optionfolder__typecontent__title'>
          Liste de contenu du dossier
        </div>
        <div className='optionfolder__typecontent__desc mt-3'>
          Vous pouvez choisir quel type de contenu le dossier pourra gérer
        </div>
        <form className='optionfolder__typecontent__form mt-4'>

          <div className='optionfolder__typecontent__form__wrapper d-flex align-items-center flex-wrap mb-5'>

            <div className='optionfolder__typecontent__form__apphtml d-flex align-items-center mr-4'>
              <input id='checkBox' type='checkbox' name='typecontent' className='mr-4' />
              <div className='optionfolder__typecontent__form__apphtml__label d-flex align-items-center'>
                <div className='optionfolder__typecontent__form__apphtml__label__icon mr-2'>
                  <i className='fa fa-file-text-o' />
                </div>
                <div className='optionfolder__typecontent__form__apphtml__label__text'>
                  Page Html
                </div>
              </div>
            </div>

            <div className='optionfolder__typecontent__form__appfile d-flex align-items-center mr-4'>
              <input id='checkBox' type='checkbox' name='typecontent' className='mr-4' />
              <div className='optionfolder__typecontent__form__appfile__label d-flex align-items-center'>
                <div className='optionfolder__typecontent__form__appfile__label__icon mr-2'>
                  <i className='fa fa-file-image-o' />
                </div>
                <div className='optionfolder__typecontent__form__appfile__label__text'>
                  Fichier
                </div>
              </div>
            </div>

            <div className='optionfolder__typecontent__form__appthread d-flex align-items-center mr-4'>
              <input id='checkBox' type='checkbox' name='typecontent' className='mr-4' />
              <div className='optionfolder__typecontent__form__appthread__label d-flex align-items-center'>
                <div className='optionfolder__typecontent__form__appthread__label__icon mr-2'>
                  <i className='fa fa-comments-o' />
                </div>
                <div className='optionfolder__typecontent__form__appthread__label__text'>
                  Discussion
                </div>
              </div>
            </div>

            <div className='optionfolder__typecontent__form__appmarkdown d-flex align-items-center mr-4'>
              <input id='checkBox' type='checkbox' name='typecontent' className='mr-4' />
              <div className='optionfolder__typecontent__form__appmarkdown__label d-flex align-items-center'>
                <div className='optionfolder__typecontent__form__appmarkdown__label__icon mr-2'>
                  <i className='fa fa-file-code-o' />
                </div>
                <div className='optionfolder__typecontent__form__appmarkdown__label__text'>
                  Page markdown
                </div>
              </div>
            </div>

            <div className='optionfolder__typecontent__form__apptask d-flex align-items-center mr-4'>
              <input id='checkBox' type='checkbox' name='typecontent' className='mr-4' />
              <div className='optionfolder__typecontent__form__apptask__label d-flex align-items-center'>
                <div className='optionfolder__typecontent__form__apptask__label__icon mr-2'>
                  <i className='fa fa-list-ul' />
                </div>
                <div className='optionfolder__typecontent__form__apptask__label__text'>
                  Tâches
                </div>
              </div>
            </div>

            <div className='optionfolder__typecontent__form__appissue d-flex align-items-center mr-4'>
              <input id='checkBox' type='checkbox' name='typecontent' className='mr-4' />
              <div className='optionfolder__typecontent__form__appissue__label d-flex align-items-center'>
                <div className='optionfolder__typecontent__form__appissue__label__icon mr-2'>
                  <i className='fa fa-ticket' />
                </div>
                <div className='optionfolder__typecontent__form__appissue__label__text'>
                  Tickets
                </div>
              </div>
            </div>

          </div>

          <div className='optionfolder__typecontent__form__btn'>
            <button type='submit' className='btn btn-outline-primary py-2 px-4'>
              Valider
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default PageHtml
