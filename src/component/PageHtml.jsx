import React from 'react'
import { TextAreaApp } from 'tracim_lib'
import { MODE } from '../helper.js'

const PageHtml = props => {
  return (
    <div className='wsContentPageHtml__contentpage__textnote'>
      {props.mode === MODE.VIEW &&
        <div>
          <div className='wsContentPageHtml__contentpage__textnote__latestversion' dangerouslySetInnerHTML={{__html: props.version}} />
          <div className='wsContentPageHtml__contentpage__textnote__text' dangerouslySetInnerHTML={{__html: props.text}} />
        </div>
      }

      {props.mode === MODE.EDIT &&
        <TextAreaApp customClass={'wsContentPageHtml'} onClickCancelBtn={props.onClickCloseEditMode} />
      }
    </div>
  )
}

export default PageHtml
