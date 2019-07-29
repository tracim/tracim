import React from 'react'
import { withTranslation } from 'react-i18next'
import Radium from 'radium'

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
              {props.t('Size')}: {props.fileSize}
            </div>

            <div className='fileProperties__content__detail__item'>
              {props.t('Page number')}: {props.filePageNb}
            </div>

            <div className='fileProperties__content__detail__description'>
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
                      >
                        {props.t('Cancel')}
                      </button>

                      <button
                        type='button'
                        className='fileProperties__content__detail__description__editiondesc__validate btn'
                        onClick={this.handleClickValidateNewDescription}
                      >
                        {props.t('Validate')}
                      </button>
                    </div>
                  </form>
                )
                : (
                  <div>
                    {props.t('Description')}: {props.description}
                  </div>
                )
              }
            </div>

            {props.displayChangeDescriptionBtn && !state.displayFormNewDescription &&
              <button
                type='button'
                className='fileProperties__content__detail__btndesc btn outlineTextBtn'
                onClick={this.handleToggleFormNewDescription}
                style={{
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: props.color,
                  ':hover': {
                    backgroundColor: props.color
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

export default withTranslation()(Radium(FileProperties))
