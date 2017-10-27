import React from 'react'

export const Header = props => {
  return (
    <div>
      { props.user.isLogedIn
        ? `'Soir ${props.user.firstname} ${props.user.lastname}.`
        : 'Why dont you connect yourself ?'
      }
    </div>
  )
}
