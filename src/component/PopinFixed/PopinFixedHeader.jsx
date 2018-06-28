import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

class PopinFixedHeader extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      editTitle: false,
      editTitleValue: ''
    }
  }

  componentDidUpdate (prevProps) {
    if (prevProps.title !== this.props.title) this.setState({editTitleValue: this.props.title})
  }

  onChangeTitle = e => {
    const newTitle = e.target.value
    this.setState({editTitleValue: newTitle})
  }

  handleClickChangeTitleBtn = () => {
    if (this.state.editTitle) this.props.onValidateChangeTitle(this.state.editTitleValue)

    this.setState(prevState => ({editTitle: !prevState.editTitle}))
  }

  render () {
    const { customClass, faIcon, title, onClickCloseBtn } = this.props

    return (
      <div className={classnames('wsContentGeneric__header', `${customClass}__header`)}>
        <div className={classnames('wsContentGeneric__header__icon', `${customClass}__header__icon`)}>
          <i className={`fa fa-${faIcon}`} />
        </div>

        <div className={classnames('wsContentGeneric__header__title mr-auto', `${customClass}__header__title`)}>
          {this.state.editTitle
            ? <input value={this.state.editTitleValue} onChange={this.onChangeTitle} />
            : <div>{title}</div>
          }
        </div>

        <div
          className={classnames('wsContentGeneric__header__edittitle', `${customClass}__header__changetitle`)}
          onClick={this.handleClickChangeTitleBtn}
        >
          {this.state.editTitle ? <i className='fa fa-check' /> : <i className='fa fa-pencil' />}
        </div>

        <div
          className={classnames('wsContentGeneric__header__close', `${customClass}__header__close`)}
          onClick={onClickCloseBtn}
        >
          <i className='fa fa-times' />
        </div>
      </div>
    )
  }
}

export default PopinFixedHeader

PopinFixedHeader.propTypes = {
  faIcon: PropTypes.string.isRequired,
  onClickCloseBtn: PropTypes.func.isRequired,
  customClass: PropTypes.string,
  title: PropTypes.string,
  onValidateChangeTitle: PropTypes.func
}

PopinFixedHeader.defaultProps = {
  customClass: '',
  title: '',
  onChangeTitle: () => {}
}
