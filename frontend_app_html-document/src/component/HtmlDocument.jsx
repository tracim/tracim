import React from 'react'
import PropTypes from 'prop-types'
import {
  TextAreaApp,
  DisplayState
} from 'tracim_frontend_lib'
import { MODE } from '../helper.js'
import { withTranslation } from 'react-i18next'

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

      <div className='wsContentHtmlDocument__contentpage__textnote html-document__contentpage__textnote'>
        {props.mode === MODE.VIEW && props.isDraftAvailable && (
          <DisplayState
            msg={props.t('You have a pending draft')}
            type='link'
            icon='hand-o-right'
            btnLabel={props.t('resume writing')}
            onClickBtn={props.onClickShowDraft}
          />
        )}

        {(props.mode === MODE.VIEW || props.mode === MODE.REVISION) && (
          <div>
            <div className='html-document__contentpage__textnote__version'>
              version n°
              <div dangerouslySetInnerHTML={{ __html: props.mode === MODE.VIEW ? props.lastVersion : props.version }} />
              {props.mode === MODE.REVISION &&
                <div className='html-document__contentpage__textnote__lastversion outlineTextBtn'>
                  ({props.t('latest version :')} {props.lastVersion})
                </div>
              }
            </div>
            {/* need try to inject html in stateless component () => <span>{props.text}</span> */}
            <div className='html-document__contentpage__textnote__text' dangerouslySetInnerHTML={{ __html: props.text }} />
          </div>
        )}

        {props.mode === MODE.EDIT &&
          <TextAreaApp
            id={props.wysiwygNewVersion}
            customClass={'html-document__editionmode'}
            customColor={props.customColor}
            onClickCancelBtn={props.onClickCloseEditMode}
            disableValidateBtn={props.disableValidateBtn}
            onClickValidateBtn={props.onClickValidateBtn}
            text={props.text}
            onChangeText={props.onChangeText}
          />
        }
      </div>
    </div>
  )
}

export default withTranslation()(HtmlDocument)

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
