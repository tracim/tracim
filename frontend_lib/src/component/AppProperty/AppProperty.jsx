import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import Radium from 'radium'
import IconButton from '../Button/IconButton.jsx'
import PromptMessage from '../PromptMessage/PromptMessage.jsx'
import TinyEditor from '../TinyEditor/TinyEditor.jsx'
import HTMLContent from '../HTMLContent/HTMLContent.jsx'

export class AppProperty extends React.Component {
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

  changeDescription = newValue => {
    this.setState({ newDescription: newValue })
  }

  handleClickValidateNewDescription = () => {
    this.props.onClickValidateNewDescription(this.state.newDescription)
    this.setState({ displayFormNewDescription: false })
  }

  render () {
    const { props, state } = this

    return (
      <div className='appProperty'>
        <div className='appProperty__content'>
          <div className='appProperty__content__detail'>
            {props.readOnlyFieldList.map((field, i) => (
              <div
                className='appProperty__content__detail__item'
                title={field.title || ''}
                key={`appProperty__item_${i}`}
              >
                {field.label || ''} {field.value || ''}
              </div>
            ))}

            <div className='appProperty__content__detail__description'>
              {props.t('Description:')}
            </div>

            {(state.displayFormNewDescription
              ? (
                <form className='appProperty__content__detail__description__editiondesc'>
                  <TinyEditor
                    apiUrl={props.apiUrl}
                    content={state.newDescription}
                    setContent={this.changeDescription}
                    placeholder=''
                    language={props.language}
                    userList={props.mentionUserList}
                    codeLanguageList={props.codeLanguageList}
                  />

                  {props.disableChangeDescription && (
                    <PromptMessage
                      msg={props.t("The file has been updated, it can't be edited anymore")}
                      icon='warning'
                    />
                  )}

                  <div className='appProperty__content__detail__description__editiondesc__btn'>
                    <IconButton
                      customClass='appProperty__content__detail__description__editiondesc__btn__cancel'
                      color={props.color}
                      intent='secondary'
                      onClick={this.handleToggleFormNewDescription}
                      icon='fas fa-times'
                      text={props.t('Cancel')}
                      key='cancelBtn'
                    />

                    <IconButton
                      customClass='appProperty__content__detail__description__editiondesc__btn__validate'
                      color={props.color}
                      disabled={props.disableChangeDescription}
                      intent='primary'
                      mode='light'
                      onClick={this.handleClickValidateNewDescription}
                      icon='fas fa-check'
                      text={props.t('Validate')}
                      key='validateBtn'
                    />
                  </div>
                </form>
              )
              : (
                <div className='appProperty__content__detail__description__text'>
                  <HTMLContent
                    iframeWhitelist={props.iframeWhitelist}
                    htmlValue={props.description}
                  />
                </div>
              )
            )}

            {props.displayChangeDescriptionBtn && !state.displayFormNewDescription && (
              <IconButton
                customClass='appProperty__content__detail__btndesc'
                color={props.color}
                disabled={props.disableChangeDescription}
                intent='primary'
                mode='light'
                onClick={this.handleToggleFormNewDescription}
                icon='fas fa-edit'
                text={props.t('Change description')}
              />
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default translate()(Radium(AppProperty))

AppProperty.propTypes = {
  apiUrl: PropTypes.string,
  readOnlyFieldList: PropTypes.array,
  language: PropTypes.string,
  mentionUserList: PropTypes.array,
  codeLanguageList: PropTypes.array,
  onClickValidateNewDescription: PropTypes.func,
  description: PropTypes.string,
  displayChangeDescriptionBtn: PropTypes.bool,
  color: PropTypes.string,
  iframeWhitelist: PropTypes.array
}

AppProperty.defaultProps = {
  apiUrl: '',
  readOnlyFieldList: [],
  language: '',
  mentionUserList: [],
  codeLanguageList: [],
  onClickValidateNewDescription: () => {},
  description: '',
  displayChangeDescriptionBtn: false,
  color: '',
  iframeWhitelist: []
}
