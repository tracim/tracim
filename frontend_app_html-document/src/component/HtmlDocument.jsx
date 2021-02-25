import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import classnames from 'classnames'

import {
  APP_FEATURE_MODE,
  ConfirmPopup,
  MentionAutoComplete,
  PromptMessage,
  HTMLContent,
  TextAreaApp,
  IconButton
} from 'tracim_frontend_lib'
import { TRANSLATION_STATE } from '../helper.js'

export const HtmlDocument = props => {
  const TOGGLE_TRANSLATION_TEXT = {
    [TRANSLATION_STATE.TRANSLATED]: props.t('Restore the original language'),
    [TRANSLATION_STATE.UNTRANSLATED]: props.t('Show translation'),
    [TRANSLATION_STATE.DISABLED]: null,
    [TRANSLATION_STATE.PENDING]: null
  }
  const toggleTranslationText = TOGGLE_TRANSLATION_TEXT[props.translationState]
  return (
    <div className='html-document__contentpage__left__wrapper'>
      {props.displayNotifyAllMessage && (
        <PromptMessage
          msg={
            <span>{props.t('To notify all members of the space of your modification')},
              <button
                className='btn buttonLink'
                onClick={props.onClickNotifyAll}
              >
                {props.t('click here!')}
              </button>
            </span>
          }
          btnType='link'
          icon='far fa-hand-point-right'
          btnLabel={<i className='fas fa-times' />}
          onClickBtn={props.onClickCloseNotifyAllMessage}
        />
      )}

      {props.isArchived && (
        <PromptMessage
          msg={props.t('This content is archived')}
          btnType='button'
          icon='fas fa-archive'
          btnLabel={props.t('Restore')}
          onClickBtn={props.onClickRestoreArchived}
        />
      )}

      {props.isDeleted && (
        <PromptMessage
          msg={props.t('This content is deleted')}
          btnType='button'
          icon='far fa-trash-alt'
          btnLabel={props.t('Restore')}
          onClickBtn={props.onClickRestoreDeleted}
        />
      )}

      {props.isDeprecated && (
        <PromptMessage
          msg={props.t('This content is deprecated')}
          icon={props.deprecatedStatus.faIcon}
        />
      )}

      <div className='wsContentHtmlDocument__contentpage__textnote html-document__contentpage__textnote'>
        {props.mode === APP_FEATURE_MODE.VIEW && props.isDraftAvailable && (
          <PromptMessage
            msg={props.t('You have a pending draft')}
            btnType='link'
            icon='far fa-hand-point-right'
            btnLabel={props.t('Resume writing')}
            onClickBtn={props.onClickShowDraft}
          />
        )}
        {(props.mode === APP_FEATURE_MODE.VIEW || props.mode === APP_FEATURE_MODE.REVISION) && (
          <div>
            <div className='html-document__contentpage__textnote__top'>
              {props.translationState === TRANSLATION_STATE.PENDING && (
                <span className='html-document__contentpage__textnote__top__translation'>
                  <i className='fa fa-spinner fa-spin' /> {props.t('Translation pending…')}
                </span>
              )}
              {toggleTranslationText && (
                <IconButton
                  text={toggleTranslationText}
                  onClick={props.onClickToggleTranslation}
                  intent='link'
                  mode='light'
                  customClass='html-document__contentpage__textnote__top__translation'
                  dataCy='htmlDocumentTranslationButton'
                />
              )}
              <div className='html-document__contentpage__textnote__top__version'>
                {props.t(
                  'Version #{{versionNumber}}', {
                    versionNumber: props.mode === APP_FEATURE_MODE.VIEW && !props.isRefreshNeeded
                      ? props.lastVersion
                      : props.version
                  }
                )}
                {(props.mode === APP_FEATURE_MODE.REVISION || props.isRefreshNeeded) && (
                  <div className='html-document__contentpage__textnote__top__lastversion'>
                    ({props.t('latest version: {{versionNumber}}', { versionNumber: props.lastVersion })})
                  </div>
                )}
              </div>
            </div>
            {/* need try to inject html in stateless component () => <span>{props.text}</span> */}
            <div className={classnames('html-document__contentpage__textnote__text', { 'html-document__contentpage__textnote__text_translated primaryColorBorder': props.translationState === TRANSLATION_STATE.TRANSLATED })}>
              <HTMLContent>{props.text}</HTMLContent>
            </div>
          </div>
        )}

        {props.showInvalidMentionPopup && (
          <ConfirmPopup
            onConfirm={props.onClickCancelSave}
            onClose={props.onClickCancelSave}
            onCancel={props.onClickSaveAnyway}
            msg={
              <>
                {props.t('Your text contains mentions that do not match any member of this space:')}
                <div className='html-document__contentpage__textnote__mentions'>
                  {props.invalidMentionList.join(', ')}
                </div>
              </>
            }
            confirmLabel={props.t('Edit')}
            cancelLabel={props.t('Validate anyway')}
          />
        )}

        {(props.mode === APP_FEATURE_MODE.EDIT &&
          <div className='html-document__editionmode__container'>
            {props.isAutoCompleteActivated && props.autoCompleteItemList.length > 0 && (
              <MentionAutoComplete
                apiUrl={props.apiUrl}
                autoCompleteItemList={props.autoCompleteItemList}
                autoCompleteCursorPosition={props.autoCompleteCursorPosition}
                onClickAutoCompleteItem={props.onClickAutoCompleteItem}
                style={{
                  top: props.tinymcePosition.top +
                    (props.tinymcePosition.isSelectionToTheTop ? props.tinymcePosition.selectionHeight : 0),
                  transform: !props.tinymcePosition.isSelectionToTheTop ? 'translateY(-100%)' : 'none',
                  position: props.tinymcePosition.isFullscreen ? 'fixed' : 'absolute',
                  zIndex: props.tinymcePosition.isFullscreen ? 1061 : 20
                }}
                delimiterIndex={props.autoCompleteItemList.filter(item => item.isCommon).length - 1}
              />
            )}
            <TextAreaApp
              id={props.wysiwygNewVersion}
              customClass='html-document__editionmode'
              customColor={props.customColor}
              onClickCancelBtn={props.onClickCloseEditMode}
              disableValidateBtn={props.disableValidateBtn}
              onClickValidateBtn={props.onClickValidateBtn}
              text={props.text}
              onChangeText={props.onChangeText}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default translate()(HtmlDocument)

HtmlDocument.propTypes = {
  mode: PropTypes.string,
  apiUrl: PropTypes.string.isRequired,
  customColor: PropTypes.string,
  wysiwygNewVersion: PropTypes.string,
  disableValidateBtn: PropTypes.bool,
  version: PropTypes.string,
  lastVersion: PropTypes.number,
  text: PropTypes.string,
  isArchived: PropTypes.bool,
  isDeleted: PropTypes.bool,
  isDeprecated: PropTypes.bool,
  deprecatedStatus: PropTypes.object,
  isDraftAvailable: PropTypes.bool,
  onClickValidateBtn: PropTypes.func,
  onChangeText: PropTypes.func,
  onClickCloseEditMode: PropTypes.func,
  onClickCloseNotifyAllMessage: PropTypes.func,
  onClickNotifyAll: PropTypes.func,
  onClickRestoreArchived: PropTypes.func,
  onClickRestoreDeleted: PropTypes.func,
  onClickShowDraft: PropTypes.func,
  isRefreshNeeded: PropTypes.bool,
  onClickToggleTranslation: PropTypes.func,
  translationState: PropTypes.oneOf(Object.values(TRANSLATION_STATE))
}
