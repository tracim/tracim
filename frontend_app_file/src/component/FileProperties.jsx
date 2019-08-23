import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'

const color = require('color')

require('./FileProperties.styl')

export class FileProperties extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      displayFormNewDescription: false,
      newDescription: ''
    }
  }

  handleToggleFormNewDescription = () => this.setState(prev => ({
    displayFormNewDescription: !prev.displayFormNewDescription,
    newDescription: this.props.description
  }))

  handleChangeDescription = e => this.setState({ newDescription: e.target.value })

  handleClickValidateNewDescription = () => {
    this.props.onClickValidateNewDescription(this.state.newDescription)
    this.setState({ displayFormNewDescription: false })
  }

  render () {
    const { props, state } = this

    return (
      <div className='fileProperties'>
        <div className='fileProperties__title'>
          {props.t('Properties')}
        </div>
        <div className='fileProperties__content'>
          <div className='fileProperties__content__detail'>
            <div className='fileProperties__content__detail__item'>
              {props.t('Type:')} {props.fileType}
            </div>

            <div className='fileProperties__content__detail__item'>
              {props.t('Size:')} {props.fileSize}
            </div>

            <div className='fileProperties__content__detail__item'>
              {props.t('Page number:')} {props.filePageNb}
            </div>

            <div className='fileProperties__content__detail__item' title={props.creationDateFormatted} >
              {props.t('Creation date:')} {props.creationDate}
            </div>

            <div className='fileProperties__content__detail__item' title={props.lastModificationFormatted} >
              {props.t('Last modification:')} {props.lastModification}
            </div>

            <div className='fileProperties__content__detail__description'>
              {props.t('Description:')}
            </div>
            {state.displayFormNewDescription
              ? (
                <form className='fileProperties__content__detail__description__editiondesc'>
                  <textarea
                    value={state.newDescription}
                    onChange={this.handleChangeDescription}
                  />

                  <div className='fileProperties__content__detail__description__editiondesc__btn'>
                    <button
                      type='button'
                      className='fileProperties__content__detail__description__editiondesc__btn__cancel btn'
                      onClick={this.handleToggleFormNewDescription}
                      key='cancelBtn'
                      style={{
                        ':hover': {
                          backgroundColor: props.color
                        }
                      }}
                    >
                      {props.t('Cancel')}
                    </button>

                    <button
                      type='button'
                      className='fileProperties__content__detail__description__editiondesc__btn__validate btn'
                      onClick={this.handleClickValidateNewDescription}
                      key='validateBtn'
                      style={{
                        ':hover': {
                          backgroundColor: props.color
                        }
                      }}
                    >
                      {props.t('Validate')}
                    </button>
                  </div>
                </form>
              )
              : (
                <div className='fileProperties__content__detail__description__text'>
                  {props.description}
                </div>
              )
            }

            {props.displayChangeDescriptionBtn && !state.displayFormNewDescription &&
              <button
                type='button'
                className='fileProperties__content__detail__btndesc btn highlightBtn'
                onClick={this.handleToggleFormNewDescription}
                style={{
                  backgroundColor: props.color,
                  ':hover': {
                    backgroundColor: color(props.color).darken(0.15).hex()
                  }
                }}
                disabled={props.disableChangeDescription}
              >
                {props.t('Change description')}
              </button>
            }
          </div>
        </div>
      </div>
    )
  }
}

export default translate()(Radium(FileProperties))
