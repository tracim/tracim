import React, { Component } from 'react'

class FlashMessage extends Component {
  render() {
    return(
      <div className='flashmessage'>
        <div className='flashmessage__container card'>
          <div className='flashmessage__container__header' />

          <div className='card-body nopadding'>

            <div className='flashmessage__container__close'>
              <i className='fa fa-times' />
            </div>

            <div className='flashmessage__container__content'>
              <div className='flashmessage__container__content__icon'>
                <i className='fa fa-times-circle' />
              </div>

              <div className='flashmessage__container__content__text'>
                <div className='flashmessage__container__content__text__title'>
                  Sorry !
                </div>
                <div className='flashmessage__container__content__text__paragraph'>
                  Reprehenderit reprehenderit veniam dolore velit dolor velit in occaecat dolor veniam nisi officia velit consequat amet cupidatat.
                  Reprehenderit reprehenderit veniam dolore velit dolor velit in occaecat dolor veniam nisi officia velit consequat amet cupidatat.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default FlashMessage
