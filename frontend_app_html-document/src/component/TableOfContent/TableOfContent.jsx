import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import { generateTocHtml } from '../../helper'

require('./TableOfContent.styl')

export const TableOfContent = props => {
  const tocHtml = generateTocHtml(props.content)
  return (
    <div className={classnames('tableOfContent', props.forceShow ? 'visible' : '')}>
      <div
        className='tableOfContent__toc'
        dangerouslySetInnerHTML={{ __html: tocHtml }}
      />
    </div>
  )
}

export default translate()(TableOfContent)

TableOfContent.propTypes = {
  content: PropTypes.string,
  forceShow: PropTypes.bool
}

TableOfContent.defaultProps = {
  content: '',
  forceShow: false
}
