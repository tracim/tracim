import React from 'react'
import PropTypes from 'prop-types'
// import { Link } from 'react-router-dom'
import { translate } from 'react-i18next'

export const ContentActivityFooter = props => {
  return (
    <div>
      FOOTER
    </div>
  )
}

export default translate()(ContentActivityFooter)

ContentActivityFooter.propTypes = {
  content: PropTypes.object.isRequired,
  reactionList: PropTypes.array.isRequired,
  commentList: PropTypes.array.isRequired
}
