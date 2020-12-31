import React from 'react'
// require('./HTMLContent.styl') // see https://github.com/tracim/tracim/issues/1156

export default (props) => (
  <article className='html-content' dangerouslySetInnerHTML={{ __html: props.children }} />
)
