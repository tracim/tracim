import React from 'react'

const PageHtml = props => {
  return (
    <div className='wsFilePageHtml__contentpage__textnote'>
      <div className='wsFilePageHtml__contentpage__textnote__latestversion' dangerouslySetInnerHTML={{__html: props.version}} />
      <div className='wsFilePageHtml__contentpage__textnote__text' dangerouslySetInnerHTML={{__html: props.text}} />

      <form className='wsFilePageHtml__contentpage__textnote__edition editionmode'>
        <textarea className='wsFilePageHtml__contentpage__textnote__edition__text editionmode__text' />
        <input type='submit' className='wsFilePageHtml__contentpage__textnote__edition__submit editionmode__submit' value='Valider' />
      </form>
    </div>
  )
}

export default PageHtml
