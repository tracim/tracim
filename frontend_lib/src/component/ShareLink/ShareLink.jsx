import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'
import ComposedIcon from '../Icon/ComposedIcon.jsx'

class ShareLink extends React.Component {
  handleCopyToClipboard = () => {
    let tmp = document.createElement('textarea')
    document.body.appendChild(tmp)
    tmp.value = this.props.link
    tmp.select()
    document.execCommand('copy')
    document.body.removeChild(tmp)
    /* or https://stackoverflow.com/questions/36639681/how-to-copy-text-from-a-div-to-clipboard See what's best */
  }

  render () {
    const { props } = this

    return (
      <div className='shareLink d-flex'>
        <div className='shareLink__icon'>
          <ComposedIcon
            icon='link'
            smallIcon='lock'
            style={{color: '#ababab'}}             // FIXME - GB - 2019-07-26 - Replace this hardcoded values to webpack variables
            smallIconStyle={{color: '#252525'}}    // https://github.com/tracim/tracim/issues/2098
          />
        </div>
        <div className='shareLink__linkInfos'>
          <div className='shareLink__linkInfos__email'>
            {props.email}
          </div>
          <div className='shareLink__linkInfos__link' id='shareLink'>
            {props.link}
          </div>
        </div>

        <button
          className='iconBtn'
          key='copy_share_link'
          style={{
            ':hover': {
              color: props.hexcolor
            }
          }}
          title={props.t('Copy link')}
          onClick={this.handleCopyToClipboard}
        >
          <i className='fa fa-fw fa-files-o'/>
        </button>
        <button
          className='iconBtn'
          key='delete_share_link'
          style={{
            ':hover': {
              color: props.hexcolor
            }
          }}
          title={props.t('Delete link')}
          onClick={() => props.onClickDeleteShareLink(props.id)}
        >
          <i className='fa fa-fw fa-trash-o'/>
        </button>

      </div>
    )
  }
}
export default translate()(Radium(ShareLink))
