import React from 'react'
import classnames from 'classnames'

const FlashMessage = props => {
  return (
    <div className='flashmessage'>
      {props.flashMessage.length > 0 && (
        <div className='flashmessage__container card'>
          <div className={classnames('flashmessage__container__header', props.flashMessage[0].type)} />

          <div className='card-body nopadding'>
            <div className='flashmessage__container__close' onClick={() => props.removeFlashMessage(props.flashMessage[0].message)}>
              <i className='fa fa-times' />
            </div>

            <div className='flashmessage__container__content'>
              <div className={classnames('flashmessage__container__content__icon', props.flashMessage[0].type)}>
                <i className='fa fa-times-circle' />
              </div>

              <div className='flashmessage__container__content__text'>
                <div className='flashmessage__container__content__text__title'>
                  {props.t('FlashMessage.error')}
                </div>
                <div className='flashmessage__container__content__text__paragraph'>
                  {props.flashMessage[0].message}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FlashMessage
