import React from 'react'

export function bonjour () {
  console.log('bonjour ?!')
}

export const Woot = props => (
  <div>woot</div>
)

export class reactClass extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      id: 'ok'
    }
  }
  render () {
    return (
      <div>
        <Woot />
        <span>{this.state.id}</span>
      </div>
    )
  }
}
