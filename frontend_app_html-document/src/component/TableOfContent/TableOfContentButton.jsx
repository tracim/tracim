import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { Popover, IconButton } from 'tracim_frontend_lib'
import TableOfContent from './TableOfContent.jsx'

require('./TableOfContent.styl')

export const TableOfContentButton = props => {
  return (
    <div className='tableOfContentButton'>
      <div id='tableOfContentButtonPopoverAnchor'>
        <IconButton
          customClass='tableOfContentButton__button transparentButton'
          icon='fas fa-list'
          intent='secondary'
          text={props.t('Table of content')}
        />
      </div>

      {props.shouldShowToc && (
        <Popover
          placement='bottom'
          targetId='tableOfContentButtonPopoverAnchor'
          trigger='click'
          popoverBody={
            <TableOfContent content={props.content} />
          }
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
