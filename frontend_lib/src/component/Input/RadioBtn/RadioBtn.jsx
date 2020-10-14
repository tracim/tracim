import React from 'react'
import PropTypes from 'prop-types'

const POSITION_BOTTOM = 'bottom'
const POSITION_RIGHT = 'right'
const POSITION_LEFT = 'left'

require('./RadioBtn.styl')

class RadioBtn extends React.Component {
  handleClick () {
    this.props.onClick(this.props.index)
  }

  render () {
    const { isChecked, value, text } = this.props
    return (
      <div
        className={'radio_btn_group__btn ' + (isChecked ? 'radio_btn_group__btn__checked' : '')}
        onClick={this.handleClick.bind(this)}
        onKeyDown={this.props.onKeyDown || (() => {})}
        data-value={value}
        tabIndex='0'
      >
        <label>{text}</label>
      </div>
    )
  }
}

RadioBtn.propTypes = {
  onClick: PropTypes.func,
  isChecked: PropTypes.bool,
  value: PropTypes.string,
  text: PropTypes.string
}

RadioBtn.defaultProps = {
  onClick: () => {},
  isChecked: false,
  value: '',
  text: ''
}

class RadioBtnWithImage extends React.Component {
  handleClick () {
    this.props.onClick(this.props.index)
  }

  getPositionStyle () {
    const style = {}
    switch (this.props.img.position) {
      case POSITION_BOTTOM: style.flexDirection = 'column-reverse'; break
      case POSITION_RIGHT: style.flexDirection = 'row-reverse'; break
      case POSITION_LEFT: style.flexDirection = 'row'; break
      default: style.flexDirection = 'column'; break
    }
    return style
  }

  render () {
    const { img, isChecked, value, text, customColor } = this.props
    const className = 'radio_btn_group__btn radio_btn_group__btn__img ' + (isChecked ? 'radio_btn_group__btn__img__checked' : '')
    const positionStyle = this.getPositionStyle()
    return (
      <div
        className={className}
        data-value={value}
        style={{
          ...positionStyle,
          borderColor: customColor
        }}
        onClick={this.handleClick.bind(this)}
        onKeyDown={this.props.onKeyDown || (() => {})}
        tabIndex='0'
      >
        <img className='radio_btn_group__btn__img__img' src={img.src} alt={img.alt} height={img.height} width={img.width} />
        <div className='radio_btn_group__btn__img__label'>{text}</div>
      </div>
    )
  }
}

RadioBtnWithImage.propTypes = {
  onClick: PropTypes.func,
  index: PropTypes.number,
  img: PropTypes.object,
  isChecked: PropTypes.bool,
  value: PropTypes.string,
  text: PropTypes.string,
  customColor: PropTypes.string
}

RadioBtnWithImage.defaultProps = {
  onClick: () => {},
  index: 0,
  img: { position: '', src: '', alt: '', height: '', width: '' },
  isChecked: false,
  value: '',
  text: '',
  customColor: ''
}

export class RadioBtnGroup extends React.Component {
  constructor (props) {
    super(props)
    const index = props.selectedIndex ? this.props.selectedIndex : null
    const value = index && props.options ? props.options[index].value : null
    this.state = {
      selectedIndex: index,
      selectedValue: value
    }
  }

  handleRadioBtnToggle = (index) => {
    const selectedValue = this.props.options[index]
    this.setState({
      selectedIndex: index,
      selectedValue: selectedValue
    })
    this.props.handleNewSelectedValue(selectedValue)
  }

  buildButtons () {
    const { options, customColor } = this.props
    return options.map((option, i) => {
      const radioProps = {
        key: i,
        isChecked: this.state.selectedIndex === i,
        text: option.text,
        value: option.value,
        index: i,
        onClick: this.handleRadioBtnToggle,
        onKeyDown: this.props.onKeyDown
      }

      return (
        option.img
          ? <RadioBtnWithImage {...radioProps} img={option.img} customColor={customColor} />
          : <RadioBtn {...radioProps} />
      )
    })
  }

  render () {
    return (
      <div className='radio_btn_group'>{this.buildButtons()}</div>
    )
  }
}

RadioBtnGroup.propTypes = {
  selectedIndex: PropTypes.number,
  options: PropTypes.arrayOf(PropTypes.object),
  handleNewSelectedValue: PropTypes.func,
  customColor: PropTypes.string,
  onKeyDown: PropTypes.func
}

RadioBtnGroup.defaultProps = {
  selectedIndex: 0,
  options: [],
  handleNewSelectedValue: () => {},
  customColor: '',
  onKeyDown: () => {}
}

export default RadioBtnGroup
