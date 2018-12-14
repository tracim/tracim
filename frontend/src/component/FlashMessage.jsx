import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

require('./FlashMessage.styl')

const FlashMessage = props => {
  if (!props.flashMessage.length || props.flashMessage.length === 0) return null

  const dataTypeArray = [{
    id: 'info',
    icon: 'lightbulb-o',
    label: props.t('Information')
  }, {
    id: 'warning',
    icon: 'exclamation-circle',
    label: props.t('Warning')
  }, {
    id: 'danger',
    icon: 'minus-circle',
    label: props.t('Error')
  }]

  const dataType = dataTypeArray.find(t => t.id === props.flashMessage[0].type)

  return (
    <div className='flashmessage' data-cy='flashmessage'>
      {props.flashMessage.length > 0 && (
        <div className='flashmessage__container card'>
          <div className={classnames('flashmessage__container__header', `bg-${dataType.id}`)} />

          <div className='card-body nopadding'>
            <div className='flashmessage__container__close'>
              <div className='flashmessage__container__close__icon' onClick={() => props.removeFlashMessage(props.flashMessage[0].message)}>
                <i className='fa fa-times' />
              </div>
            </div>

            <div className='flashmessage__container__content'>
              <div className={classnames('flashmessage__container__content__icon', `text-${dataType.id}`)}>
                <i className={classnames(`fa fa-${dataType.icon}`)} />
              </div>

              <div className='flashmessage__container__content__text'>
                <div className='flashmessage__container__content__text__title'>
                  {dataType.label}
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

FlashMessage.propTypes = {
  type: PropTypes.oneOf(['info', 'warning', 'danger'])
}
