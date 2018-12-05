import React from 'react'
import { TextAreaApp } from 'tracim_frontend_lib'
import { MODE } from '../helper.js'
import { translate } from 'react-i18next'

const HtmlDocument = props => {
  return (
    <div className='wsContentHtmlDocument__contentpage__textnote html-document__contentpage__textnote'>
      {props.isArchived &&
        <div className='html-document__contentpage__textnote__state'>
          <div className='html-document__contentpage__textnote__state__msg'>
            <i className='fa fa-fw fa-archive' />
            {props.t('This content is archived.')}
          </div>

          <button className='html-document__contentpage__textnote__state__btnrestore btn' onClick={props.onClickRestoreArchived}>
            <i className='fa fa-fw fa-archive' />
            {props.t('Restore')}
          </button>
        </div>
      }

      {props.isDeleted &&
        <div className='html-document__contentpage__textnote__state'>
          <div className='html-document__contentpage__textnote__state__msg'>
            <i className='fa fa-fw fa-trash' />
            {props.t('This content is deleted.')}
          </div>

          <button className='html-document__contentpage__textnote__state__btnrestore btn' onClick={props.onClickRestoreDeleted}>
            <i className='fa fa-fw fa-trash' />
            {props.t('Restore')}
          </button>
        </div>
      }

      {(props.mode === MODE.VIEW || props.mode === MODE.REVISION) &&
        <div>
          <div className='html-document__contentpage__textnote__version'>
            version n°
            <div dangerouslySetInnerHTML={{__html: props.mode === MODE.VIEW ? props.lastVersion : props.version}} />
            {props.mode === MODE.REVISION &&
              <div className='html-document__contentpage__textnote__lastversion outlineTextBtn'>
                ({props.t('latest version :')} {props.lastVersion})
              </div>
            }
          </div>
          {/* need try to inject html in stateless component () => <span>{props.text}</span> */}
          <div className='html-document__contentpage__textnote__text' dangerouslySetInnerHTML={{__html: props.text}} />
        </div>
      }

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
  )
}

export default translate()(HtmlDocument)
