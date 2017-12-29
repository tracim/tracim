import React from 'react'

const PageHtml = props => {
  return (
    <div className='wsFilePageHtml__contentpage__textnote'>
      <div className='wsFilePageHtml__contentpage__textnote__latestversion'>
        { props.version }
      </div>
      <div className='wsFilePageHtml__contentpage__textnote__text'>
        { props.text }
      </div>
    </div>
  )
}

export default PageHtml
