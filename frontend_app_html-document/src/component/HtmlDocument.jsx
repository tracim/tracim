import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import classnames from 'classnames'

import {
  APP_FEATURE_MODE,
  ConfirmPopup,
  AutoComplete,
  IconButton,
  PromptMessage,
  HTMLContent,
  RefreshWarningMessage,
  TextAreaApp,
  TRANSLATION_STATE,
  TranslateButton
} from 'tracim_frontend_lib'

export const HtmlDocument = props => {
  const isTranslated = props.translationState === TRANSLATION_STATE.TRANSLATED
  const noteClass = 'html-document__contentpage__textnote__text'
  const noteClassName = classnames(
    noteClass,
    {
      [`${noteClass}-translated primaryColorBorder`]: isTranslated
    }
  )

  return (
    <div className='html-document__contentpage__left__wrapper'>
      <div className='html-document__contentpage__option'>
        {props.mode === APP_FEATURE_MODE.REVISION && (
          <IconButton
            customClass='wsContentGeneric__option__menu__lastversion html-document__lastversionbtn btn'
            color={props.customColor}
            intent='primary'
            mode='light'
            onClick={props.onClickLastVersion}
            icon='fas fa-history'
            text={props.t('Last version')}
            title={props.t('Last version')}
          />
        )}

        {props.isRefreshNeeded && (
          <RefreshWarningMessage
            tooltip={props.t('The content has been modified by {{author}}', { author: props.editionAuthor, interpolation: { escapeValue: false } })}
            onClickRefresh={props.onClickRefresh}
          />
        )}
      </div>

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
              <TranslateButton
                translationState={props.translationState}
                targetLanguageList={props.translationTargetLanguageList}
                targetLanguageCode={props.translationTargetLanguageCode}
                onChangeTargetLanguageCode={props.onChangeTranslationTargetLanguageCode}
                onClickTranslate={props.onClickTranslateDocument}
                onClickRestore={props.onClickRestoreDocument}
                dataCy='htmlDocumentTranslateButton'
              />
            </div>
            {/* need try to inject html in stateless component () => <span>{props.text}</span> */}
            <div className={noteClassName}>
              <HTMLContent isTranslated={isTranslated}>{props.text}</HTMLContent>
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
              <AutoComplete
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
  apiUrl: PropTypes.string.isRequired,
  onChangeTranslationTargetLanguageCode: PropTypes.func.isRequired,
  translationTargetLanguageList: PropTypes.arrayOf(PropTypes.object).isRequired,
  translationTargetLanguageCode: PropTypes.string.isRequired,
  customColor: PropTypes.string,
  editionAuthor: PropTypes.string,
  wysiwygNewVersion: PropTypes.string,
  disableValidateBtn: PropTypes.bool,
  text: PropTypes.string,
  isArchived: PropTypes.bool,
  isDeleted: PropTypes.bool,
  isDeprecated: PropTypes.bool,
  deprecatedStatus: PropTypes.object,
  isDraftAvailable: PropTypes.bool,
  isRefreshNeeded: PropTypes.bool,
  mode: PropTypes.string,
  onClickValidateBtn: PropTypes.func,
  onChangeText: PropTypes.func,
  onClickCloseEditMode: PropTypes.func,
  onClickCloseNotifyAllMessage: PropTypes.func,
  onClickLastVersion: PropTypes.func,
  onClickNotifyAll: PropTypes.func,
  onClickRefresh: PropTypes.func,
  onClickRestoreArchived: PropTypes.func,
  onClickRestoreDeleted: PropTypes.func,
  onClickShowDraft: PropTypes.func,
  onClickTranslateDocument: PropTypes.func,
  onClickRestoreDocument: PropTypes.func,
  translationState: PropTypes.oneOf(Object.values(TRANSLATION_STATE))
}

HtmlDocument.defaultProps = {
  customColor: '#252525',
  editionAuthor: '',
  isRefreshNeeded: false,
  mode: APP_FEATURE_MODE.VIEW,
  onClickLastVersion: () => { },
  onClickRefresh: () => { }
}
