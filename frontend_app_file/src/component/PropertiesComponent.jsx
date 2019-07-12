import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'

require('./PropertiesComponent.styl')

export class PropertiesComponent extends React.Component {
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

  handleChangeDescription = e => this.setState({newDescription: e.target.value})

  handleClickValidateNewDescription = () => {
    this.props.onClickValidateNewDescription(this.state.newDescription)
    this.setState({displayFormNewDescription: false})
  }

  render () {
    const { props, state } = this

    return (
      <div className='propertiescomponent'>
        <div className='propertiescomponent__title'>
          {props.t('Properties')}
        </div>
        <div className='propertiescomponent__content'>
          <div className='propertiescomponent__content__detail'>
            <div className='propertiescomponent__content__detail__item'>
              {props.t('Size')}: {props.fileSize}
            </div>

            <div className='propertiescomponent__content__detail__item'>
              {props.t('Page number')}: {props.filePageNb}
            </div>

            <div className='propertiescomponent__content__detail__description'>
              {state.displayFormNewDescription
                ? (
                  <form className='propertiescomponent__content__detail__description__editiondesc'>
                    <textarea
                      value={state.newDescription}
                      onChange={this.handleChangeDescription}
                    />

                    <div className='propertiescomponent__content__detail__description__editiondesc__btn'>
                      <button
                        type='button'
                        className='propertiescomponent__content__detail__description__editiondesc__btn__cancel btn'
                        onClick={this.handleToggleFormNewDescription}
                      >
                        {props.t('Cancel')}
                      </button>

                      <button
                        type='button'
                        className='propertiescomponent__content__detail__description__editiondesc__validate btn'
                        onClick={this.handleClickValidateNewDescription}
                      >
                        {props.t('Validate')}
                      </button>
                    </div>
                  </form>
                )
                : (
                  <label>
                    {props.t('Description')}: {props.description}
                  </label>
                )
              }
            </div>

            {props.displayChangeDescriptionBtn && !state.displayFormNewDescription &&
              <button
                type='button'
                className='propertiescomponent__content__detail__btndesc btn outlineTextBtn'
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

export default translate()(Radium(PropertiesComponent))
