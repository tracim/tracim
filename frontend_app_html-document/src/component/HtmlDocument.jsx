import React from 'react'
import { TextAreaApp } from 'tracim_frontend_lib'
import { MODE } from '../helper.js'

const HtmlDocument = props => {
  return (
    <div className='wsContentHtmlDocument__contentpage__textnote html-documents__contentpage__textnote'>
      {(props.mode === MODE.VIEW || props.mode === MODE.REVISION) &&
        <div>
          <div className='html-documents__contentpage__textnote__version'>
            version n°
            <div dangerouslySetInnerHTML={{__html: props.mode === MODE.VIEW ? props.lastVersion : props.version}} />
            {props.mode === MODE.REVISION &&
              <div className='html-documents__contentpage__textnote__lastversion'>
                (dernière version : {props.lastVersion})
              </div>
            }
          </div>
          {/* need try to inject html in stateless component () => <span>{props.text}</span> */}
          <div className='html-documents__contentpage__textnote__text' dangerouslySetInnerHTML={{__html: props.text}} />
        </div>
      }

      {props.mode === MODE.EDIT &&
        <TextAreaApp
          id={props.wysiwygNewVersion}
          customClass={'html-documents__editionmode'}
          customColor={props.customColor}
          onClickCancelBtn={props.onClickCloseEditMode}
          onClickValidateBtn={props.onClickValidateBtn}
          text={props.text}
          onChangeText={props.onChangeText}
        />
      }
    </div>
  )
}

export default HtmlDocument
