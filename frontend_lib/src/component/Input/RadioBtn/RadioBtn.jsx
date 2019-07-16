import React from 'react'
import ReactDOM from 'react-dom'

class RadioBtn extends React.Component{

    constructor(props) {
        super(props);
    }

    handleClick(){
        this.props.handler(this.props.index);
    }

    render() {
        return (
            <div className="radio-btn" onClick={this.handleClick.bind(this)}>
                <div className={this.props.isChecked ? "radiobtn checked" : "radiobtn unchecked"} data-value={this.props.value}></div>
                <label>{this.props.text}</label>
            </div>
        );
    }
}

export class RadioGrp extends React.Component{

    constructor() {
        super();
        this.state = {
          selectedIndex: null,
          selectedValue: null
        };
    }

    toggleRadioBtn(index){
        this.setState({
          selectedIndex: index,
          selectedValue: this.state.options[index]
        });
    }

    render() {

        const { options } = this.props;

        const allOptions = options.map((option, i) => {
            return <RadioBtn key={i} isChecked={(this.state.selectedIndex == i)} text={option} value={option} index={i} handler={this.toggleRadioBtn} />
        });

        return (
            <div className="radio-btn-group">{allOptions}</div>
        );
    }
}

export default RadioGrp