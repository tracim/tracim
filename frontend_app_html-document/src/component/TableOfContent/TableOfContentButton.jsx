import React, { useState } from 'react'
import PropTypes from 'prop-types'
// import classnames from 'classnames'
import { translate } from 'react-i18next'
import TableOfContent from './TableOfContent'
import { IconButton } from 'tracim_frontend_lib'

require('./TableOfContent.styl')

export const TableOfContentButton = props => {
  const [forceShow, setForceShow] = useState(false)

  return (
    <div className='tableOfContentButton'>
      <IconButton
        customClass='tableOfContentButton__button'
        icon='fas fa-list'
        intent='secondary'
        text={props.t('Table of content')}
        onClick={() => setForceShow(fs => !fs)}
      />

      {props.shouldShowToc && (
        <TableOfContent
          content={props.content}
          forceShow={forceShow}
        />
      )}
    </div>
  )
}

export default translate()(TableOfContentButton)

TableOfContentButton.propTypes = {
  content: PropTypes.string,
  shouldShowToc: PropTypes.bool
}

TableOfContentButton.defaultProps = {
  content: '',
  shouldShowToc: false
}
