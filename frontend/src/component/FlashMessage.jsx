import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

require('./FlashMessage.styl')

export const FlashMessage = props => {
  if (!props.flashMessage.length || props.flashMessage.length === 0) return null

  const dataTypeArray = [{
    id: 'info',
    icon: 'far fa-lightbulb',
    label: props.t('Information')
  }, {
    id: 'warning',
    icon: 'fas fa-exclamation-circle',
    label: props.t('Warning')
  }, {
    id: 'danger',
    icon: 'fas fa-minus-circle',
    label: props.t('Error')
  }]

  const dataType = dataTypeArray.find(t => t.id === props.flashMessage[0].type)

  return (
    <div className={'flashmessage ' + props.className} data-cy='flashmessage'>
      {props.flashMessage.length > 0 && (
        <div className='flashmessage__container card'>
          <div className={classnames('flashmessage__container__header', `bg-${dataType.id}`)} />

          <div className='card-body nopadding'>
            {props.showCloseButton && (
              <div className='flashmessage__container__close'>
                <div className='flashmessage__container__close__icon' onClick={() => props.onRemoveFlashMessage(props.flashMessage[0].message)}>
                  <i className='fas fa-times' />
                </div>
              </div>
            )}
            <div className='flashmessage__container__content'>
              <div className={classnames('flashmessage__container__content__icon', `text-${dataType.id}`)}>
                <i className={classnames(`${dataType.icon}`)} />
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
  type: PropTypes.oneOf(['info', 'warning', 'danger']),
  showCloseButton: PropTypes.bool,
  className: PropTypes.string
}

FlashMessage.defaultProps = {
  showCloseButton: true,
  className: ''
}
