import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import classnames from 'classnames'
import {
  APP_FEATURE_MODE,
  CONTENT_TYPE,
  DEFAULT_ROLE_LIST,
  LOCAL_STORAGE_FIELD,
  TRANSLATION_STATE,
  ConfirmPopup,
  HTMLContent,
  IconButton,
  PromptMessage,
  RefreshWarningMessage,
  TinyEditor,
  setLocalStorageItem
} from 'tracim_frontend_lib'

export const HtmlDocument = props => {
  const [textToEdit, setTextToEdit] = useState('')

  const isTranslated = props.translationState === TRANSLATION_STATE.TRANSLATED
  const noteClass = 'html-document__contentpage__textnote__text'
  const noteClassName = classnames(
    noteClass,
    {
      [`${noteClass}-translated primaryColorBorder`]: isTranslated
    }
  )

  useEffect(() => {
    setTextToEdit(props.text)
  }, [props.text])

  const updateTextToEdit = (text) => {
    setTextToEdit(text)
    setLocalStorageItem(
      props.contentType,
      props.contentId,
      props.workspaceId,
      LOCAL_STORAGE_FIELD.RAW_CONTENT,
      text
    )
  }

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
            confirmIcon='fas fa-fw fa-edit'
            cancelLabel={props.t('Validate anyway')}
            cancelIcon='fas fa-fw fa-check'
          />
        )}

        {(props.mode === APP_FEATURE_MODE.EDIT &&
          (
            <>
              <TinyEditor
                apiUrl={props.apiUrl}
                setContent={updateTextToEdit}
                // End of required props ///////////////////////////////////////////////
                codeLanguageList={props.codeLanguageList}
                content={textToEdit}
                height='100%'
                isAdvancedEdition
                isAutoResizeEnabled={false}
                isStatusBarEnabled
                language={props.lang}
                onCtrlEnterEvent={props.onClickValidateBtn}
                roleList={DEFAULT_ROLE_LIST}
                spaceId={props.workspaceId}
                userList={props.memberList}
              />

              <div className={`${props.customClass}__editionmode__button`}>
                <IconButton
                  color={props.customColor}
                  customClass={`${props.customClass}__editionmode__cancel`}
                  icon='fas fa-times'
                  intent='secondary'
                  key='TinyEditor__cancel'
                  onClick={props.onClickCloseEditMode}
                  tabIndex='1'
                  text={props.t('Cancel')}
                />

                <IconButton
                  color={props.customColor}
                  customClass={`${props.customClass}__editionmode__submit`}
                  dataCy='editionmode__button__submit'
                  disabled={props.disableValidateBtn(textToEdit)}
                  icon='fas fa-check'
                  intent='primary'
                  key='TinyEditor__validate'
                  mode='light'
                  onClick={() => props.onClickValidateBtn(textToEdit)}
                  text={props.t('Validate')}
                />
              </div>
            </>
          )
        )}
      </div>
    </div>
  )
}

export default translate()(HtmlDocument)

HtmlDocument.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  workspaceId: PropTypes.number.isRequired,
  codeLanguageList: PropTypes.array,
  contentId: PropTypes.number,
  contentType: PropTypes.string,
  customClass: PropTypes.string,
  customColor: PropTypes.string,
  disableValidateBtn: PropTypes.func,
  displayNotifyAllMessage: PropTypes.bool,
  editionAuthor: PropTypes.string,
  text: PropTypes.string,
  invalidMentionList: PropTypes.array,
  isArchived: PropTypes.bool,
  isDeleted: PropTypes.bool,
  isDeprecated: PropTypes.bool,
  deprecatedStatus: PropTypes.object,
  isDraftAvailable: PropTypes.bool,
  isRefreshNeeded: PropTypes.bool,
  isVisible: PropTypes.bool,
  lang: PropTypes.string,
  memberList: PropTypes.array,
  mode: PropTypes.string,
  onClickAutoCompleteItem: PropTypes.func,
  onClickValidateBtn: PropTypes.func,
  onClickCancelSave: PropTypes.func,
  onClickCloseEditMode: PropTypes.func,
  onClickCloseNotifyAllMessage: PropTypes.func,
  onClickLastVersion: PropTypes.func,
  onClickNotifyAll: PropTypes.func,
  onClickRefresh: PropTypes.func,
  onClickRestoreArchived: PropTypes.func,
  onClickRestoreDeleted: PropTypes.func,
  onClickSaveAnyway: PropTypes.func,
  onClickShowDraft: PropTypes.func,
  showInvalidMentionPopup: PropTypes.bool
}

HtmlDocument.defaultProps = {
  contentId: 0,
  contentType: CONTENT_TYPE.HTML_DOCUMENT,
  customClass: 'html-document',
  customColor: '#252525',
  deprecatedStatus: {
    faIcon: ''
  },
  disableValidateBtn: () => false,
  editionAuthor: '',
  invalidMentionList: [],
  isArchived: false,
  isDeleted: false,
  isDeprecated: false,
  isDraftAvailable: false,
  isRefreshNeeded: false,
  isVisible: true,
  lang: 'en',
  memberList: [],
  mode: APP_FEATURE_MODE.VIEW,
  onClickAutoCompleteItem: () => { },
  onClickCancelSave: () => { },
  onClickCloseEditMode: () => { },
  onClickCloseNotifyAllMessage: () => { },
  onClickLastVersion: () => { },
  onClickNotifyAll: () => { },
  onClickRefresh: () => { },
  onClickRestoreArchived: () => { },
  onClickRestoreDeleted: () => { },
  onClickSaveAnyway: () => { },
  onClickShowDraft: () => { },
  showInvalidMentionPopup: false,
  text: ''
}
