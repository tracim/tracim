import React from 'react'
import PropTypes from 'prop-types'
import {
  TextAreaApp,
  DisplayState,
  APP_FEATURE_MODE
} from 'tracim_frontend_lib'
import { translate } from 'react-i18next'

export const HtmlDocument = props => {
  return (
    <div className='html-document__contentpage__left__wrapper'>
      {props.isArchived && (
        <DisplayState
          msg={props.t('This content is archived')}
          btnType='button'
          icon='archive'
          btnLabel={props.t('Restore')}
          onClickBtn={props.onClickRestoreArchived}
        />
      )}

      {props.isDeleted && (
        <DisplayState
          msg={props.t('This content is deleted')}
          btnType='button'
          icon='trash'
          btnLabel={props.t('Restore')}
          onClickBtn={props.onClickRestoreDeleted}
        />
      )}

      {props.isDeprecated && (
        <DisplayState
          msg={props.t('This content is deprecated')}
          icon={props.deprecatedStatus.faIcon}
        />
      )}

      {props.keepEditingWarning && (
        <DisplayState
          msg={props.t('The content has been modified by {{author}}', { author: props.editionAuthor, interpolation: { escapeValue: false } })}
          btnType='button'
          icon='repeat'
          btnLabel={props.t('Refresh')}
          onClickBtn={props.onClickRefresh}
          tooltip={props.t('If you refresh, you will lose the current changes')}
        />
      )}

      <div className='wsContentHtmlDocument__contentpage__textnote html-document__contentpage__textnote'>
        {props.mode === APP_FEATURE_MODE.VIEW && props.isDraftAvailable && (
          <DisplayState
            msg={props.t('You have a pending draft')}
            btnType='link'
            icon='hand-o-right'
            btnLabel={props.t('Resume writing')}
            onClickBtn={props.onClickShowDraft}
          />
        )}

        {(props.mode === APP_FEATURE_MODE.VIEW || props.mode === APP_FEATURE_MODE.REVISION) && (
          <div>
            <div className='html-document__contentpage__textnote__version'>
              {props.t(
                'Version #{{versionNumber}}', {
                  versionNumber: props.mode === APP_FEATURE_MODE.VIEW
                    ? props.lastVersion
                    : props.version
                }
              )}
              {props.mode === APP_FEATURE_MODE.REVISION && (
                <div className='html-document__contentpage__textnote__lastversion outlineTextBtn'>
                  ({props.t('latest version: {{versionNumber}}', { versionNumber: props.lastVersion })})
                </div>
              )}
            </div>
            {/* need try to inject html in stateless component () => <span>{props.text}</span> */}
            <div className='html-document__contentpage__textnote__text' dangerouslySetInnerHTML={{ __html: props.text }} />
          </div>
        )}

        {(props.mode === APP_FEATURE_MODE.EDIT &&
          <div className='html-document__editionmode__container'>
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
  customColor: PropTypes.string,
  wysiwygNewVersion: PropTypes.string,
  disableValidateBtn: PropTypes.bool,
  version: PropTypes.string,
  lastVersion: PropTypes.string,
  text: PropTypes.string,
  isArchived: PropTypes.bool,
  isDeleted: PropTypes.bool,
  isDeprecated: PropTypes.bool,
  deprecatedStatus: PropTypes.object,
  isDraftAvailable: PropTypes.bool,
  onClickValidateBtn: PropTypes.func,
  onChangeText: PropTypes.func,
  onClickCloseEditMode: PropTypes.func,
  onClickRestoreArchived: PropTypes.func,
  onClickRestoreDeleted: PropTypes.func,
  onClickShowDraft: PropTypes.func
}
