import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import { generateTocHtml } from '../../helper.js'

require('./TableOfContent.styl')

export const TableOfContent = props => {
  const tocHtml = generateTocHtml(props.content)
  const shouldShowToc = tocHtml !== ''

  return (
    <div
      className={classnames(
        'tableOfContent',
        props.showToc && shouldShowToc ? 'visible' : 'hide'
      )}
    >
      <h3 className='tableOfContent__title'>
        {props.t('Table of content')}
      </h3>

      <div
        className='tableOfContent__toc'
        dangerouslySetInnerHTML={{ __html: tocHtml }}
      />

      <hr />
    </div>
  )
}

export default translate()(TableOfContent)

TableOfContent.propTypes = {
  content: PropTypes.string,
  showToc: PropTypes.bool
}

TableOfContent.defaultProps = {
  content: '',
  showToc: false
}
