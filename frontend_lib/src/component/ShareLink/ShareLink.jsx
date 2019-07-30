import React from 'react'
import { withTranslation } from 'react-i18next'
import Radium from 'radium'
import ComposedIcon from '../Icon/ComposedIcon.jsx'

class ShareLink extends React.Component {
  // INFO - GB - 2019-07-16 - Algorithm based on https://stackoverflow.com/questions/55190650/copy-link-on-button-click-into-clipboard-not-working
  handleCopyToClipboard = () => {
    let tmp = document.createElement('textarea')
    document.body.appendChild(tmp)
    tmp.value = this.props.link
    tmp.select()
    document.execCommand('copy')
    document.body.removeChild(tmp)
  }

  render () {
    const { props } = this

    return (
      <div className='shareLink'>
        <div className='shareLink__icon'>
          { props.isProtected
            ? <ComposedIcon
              mainIcon='link'
              smallIcon='lock'
              // FIXME - GB - 2019-07-26 - Replace this hardcoded values to webpack variables
              // https://github.com/tracim/tracim/issues/2098
              smallIconStyle={{color: '#252525'}}
            />
            : <i className='shareLink__icon__unprotected fa fa-fw fa-link'/>
          }
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
          key='deleteShareLink'
          style={{
            ':hover': {
              color: props.hexcolor
            }
          }}
          title={props.t('Delete link')}
          onClick={() => props.onClickDeleteShareLink(props.id)}
          data-cy='deleteShareLink'
        >
          <i className='fa fa-fw fa-trash-o'/>
        </button>

      </div>
    )
  }
}
export default withTranslation()(Radium(ShareLink))
