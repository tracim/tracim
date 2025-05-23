import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { generateTocHtml } from '../../helper.js'

require('./TableOfContent.styl')

export const TableOfContent = props => {
  const tocHtml = generateTocHtml(props.content)
  return (
    <div className='tableOfContent'>
      <div
        className='tableOfContent__toc'
        dangerouslySetInnerHTML={{ __html: tocHtml }}
      />
    </div>
  )
}

export default translate()(TableOfContent)

TableOfContent.propTypes = {
  content: PropTypes.string
}

TableOfContent.defaultProps = {
  content: ''
}
