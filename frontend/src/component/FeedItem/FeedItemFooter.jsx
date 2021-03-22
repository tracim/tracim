import React from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { connect } from 'react-redux'
import { PAGE, EmojiReactions } from 'tracim_frontend_lib'
import { FETCH_CONFIG } from '../../util/helper.js'

require('./FeedItemFooter.styl')

export class FeedItemFooter extends React.Component {
  handleCommentClicked = () => {
    const { props } = this
    props.history.push(PAGE.WORKSPACE.CONTENT(
      props.content.workspaceId,
      props.content.type,
      props.content.id
    ))
  }

  render () {
    const { props } = this
    return (
      <div className='feedItemFooter'>
        <div className='feedItemFooter__right'>
          <EmojiReactions
            apiUrl={FETCH_CONFIG.apiUrl}
            loggedUserId={props.user.userId}
            contentId={props.content.id}
            workspaceId={props.content.workspaceId}
          />
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(withRouter(translate()(FeedItemFooter)))

FeedItemFooter.propTypes = {
  content: PropTypes.object.isRequired
}
