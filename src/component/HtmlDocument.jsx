import React from 'react'
import { TextAreaApp } from 'tracim_lib'
import { MODE } from '../helper.js'

const HtmlDocument = props => {
  return (
    <div className='wsContentHtmlDocument__contentpage__textnote html-documents__contentpage__textnote'>
      {props.mode === MODE.VIEW &&
        <div>
          <div className='html-documents__contentpage__textnote__latestversion' dangerouslySetInnerHTML={{__html: props.version}} />
          <div className='html-documents__contentpage__textnote__text' dangerouslySetInnerHTML={{__html: props.text}} />
        </div>
      }

      {props.mode === MODE.EDIT &&
        <TextAreaApp
          customClass={'html-documents__editionmode'}
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
