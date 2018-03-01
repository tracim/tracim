import React from 'react'
import { TextAreaApp } from 'tracim_lib'

const PageHtml = props => {
  return (
    <div className='wsFilePageHtml__contentpage__textnote'>
      <div className='wsFilePageHtml__contentpage__textnote__latestversion' dangerouslySetInnerHTML={{__html: props.version}} />
      <div className='wsFilePageHtml__contentpage__textnote__text' dangerouslySetInnerHTML={{__html: props.text}} />

      <TextAreaApp customClass={'wsFilePageHtml'} />
    </div>
  )
}

export default PageHtml
