import React from 'react'
import ReactDOM from 'react-dom'

const POSITION_TOP = 'top'
const POSITION_BOTTOM = 'bottom'
const POSITION_RIGHT = 'right'
const POSITION_LEFT = 'left'

require('./RadioBtn.styl')

class RadioBtn extends React.Component{

    constructor(props) {
        super(props)
    }

    handleClick(){
        this.props.onClick(this.props.index)
    }

    render() {
        const { isChecked, value, text} = this.props
        return (
            <div 
                className={'radio_btn_group__btn ' + (isChecked ? 'radio_btn_group__btn__checked' : '')}
                onClick={this.handleClick.bind(this)}
                data-value={value}
            >
                <label>{text}</label>
            </div>
        )
    }
}

class RadioBtnWithImage extends React.Component{
    constructor (props) {
        super(props)
    }

    handleClick () {
        this.props.onClick(this.props.index)
    }

    getPositionStyle () {
        const style = {}
        switch (this.props.img.position) {
            case POSITION_BOTTOM: style.flexDirection = 'column-reverse'; break
            case POSITION_RIGHT: style.flexDirection = 'row-reverse'; break
            case POSITION_LEFT: style.flexDirection = 'row'; break
            default: 'column'; style.flexDirection = 'column'; break
        }
        return style
    }

    render () {
        const { img, isChecked, value, text} = this.props
        const className = 'radio_btn_group__btn radio_btn_group__btn_img ' + (isChecked ? 'radio_btn_group__btn_img__checked' : '')
        return (
            <div 
                className={className}
                onClick={this.handleClick.bind(this)}
                data-value={value}
                style={this.getPositionStyle()}
            >
                <img src={img.src} alt={img.alt} height={img.height} width={img.width} />
                <div className={'radio_btn_group__btn_img__label'}>{text}</div>
            </div>
        )
    }
}

export class RadioBtnGroup extends React.Component {
    constructor(props) {
        super(props)
        const index = props.selectedIndex ? this.props.selectedIndex  : null
        const value = index && props.options ? props.options[index].value : null
        this.state = {
          selectedIndex: index,
          selectedValue: value
        }
    }

    toggleRadioBtn (index) {
        const selectedValue = this.props.options[index]
        this.setState({
          selectedIndex: index,
          selectedValue: selectedValue
        })
        this.props.handleNewSelectedValue(selectedValue)
    }

    buildButtons () {
        const { options } = this.props
        return options.map((option, i) => {
            if (option.img) {
                return (
                    <RadioBtnWithImage
                        key={i}
                        isChecked={(this.state.selectedIndex === i)}
                        img={option.img}
                        text={option.text}
                        value={option.value}
                        index={i}
                        onClick={this.toggleRadioBtn.bind(this)}
                    />
                )
            }
                return (
                    <RadioBtn
                        key={i}
                        isChecked={(this.state.selectedIndex === i)}
                        text={option.text}
                        value={option.value}
                        index={i}
                        onClick={this.toggleRadioBtn.bind(this)}
                    />
                )
        })
    }

    render() {
        return (
            <div className="radio_btn_group">{this.buildButtons()}</div>
        )
    }
}

export default RadioBtnGroup
