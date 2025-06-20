import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import IconButton from '../Button/IconButton.jsx'
import PromptMessage from '../PromptMessage/PromptMessage.jsx'
import TinyEditor from '../TinyEditor/TinyEditor.jsx'
import HTMLContent from '../HTMLContent/HTMLContent.jsx'

export const AppDescription = props => {
  const [displayFormNewDescription, setDisplayFormNewDescription] = useState(false)
  const [newDescription, setNewDescription] = useState('')

  const handleToggleFormNewDescription = (shouldDisplayFormNewDescription) => {
    setDisplayFormNewDescription(shouldDisplayFormNewDescription)
    setNewDescription(props.description)
  }

  const changeDescription = newValue => {
    setNewDescription(newValue)
  }

  const handleClickValidateNewDescription = () => {
    props.onClickValidateNewDescription(newDescription)
    setDisplayFormNewDescription(false)
  }

  return (
    <div className='appDescription'>
      {(displayFormNewDescription
        ? (
          <div className='appDescription__form'>
            <TinyEditor
              apiUrl={props.apiUrl}
              content={newDescription}
              setContent={changeDescription}
              placeholder={props.t('Description')}
              language={props.language}
              userList={props.mentionUserList}
              codeLanguageList={props.codeLanguageList}
              isAdvancedEdition
              isMentionEnabled={false}
              isContentLinkEnabled={false}
            />

            {props.disableChangeDescription && (
              <PromptMessage
                msg={props.t("The file has been updated, it can't be edited anymore")}
                icon='warning'
              />
            )}

            <div className='appDescription__btn'>
              <IconButton
                customClass='appDescription__btn__cancel'
                color={props.color}
                intent='secondary'
                onClick={() => handleToggleFormNewDescription(!displayFormNewDescription)}
                icon='fas fa-times'
                text={props.t('Cancel')}
                key='cancelBtn'
              />

              <IconButton
                customClass='appDescription__btn__validate'
                color={props.color}
                disabled={props.disableChangeDescription}
                intent='primary'
                mode='light'
                onClick={handleClickValidateNewDescription}
                icon='fas fa-check'
                text={props.t('Validate')}
                key='validateBtn'
              />
            </div>
          </div>
        )
        : (
          <div className='appDescription__view'>
            {(props.description === ''
              ? (
                <div>{props.t('No description')}</div>
              )
              : (
                <HTMLContent
                  iframeWhitelist={props.iframeWhitelist}
                  htmlValue={props.description}
                />
              )
            )}
          </div>
        )
      )}

      {props.displayChangeDescriptionBtn && !displayFormNewDescription && (
        <div className='appDescription__editBtn'>
          <IconButton
            customClass=''
            color={props.color}
            disabled={props.disableChangeDescription}
            intent='primary'
            mode='light'
            onClick={handleToggleFormNewDescription}
            icon='fas fa-edit'
            text={props.t('Change description')}
          />
        </div>
      )}
    </div>
  )
}

export default translate()(AppDescription)

AppDescription.propTypes = {
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

AppDescription.defaultProps = {
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
