import React from 'react'

const PageHtml = props => {
  return (
    <div className='wsFilePageHtml__contentpage__textnote'>
      <div className='wsFilePageHtml__contentpage__textnote__latestversion' dangerouslySetInnerHTML={{__html: props.version}} />
      <div className='wsFilePageHtml__contentpage__textnote__text' dangerouslySetInnerHTML={{__html: props.text}} />
    </div>
  )
}

export default PageHtml
