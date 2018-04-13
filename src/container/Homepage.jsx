import React, { Component } from 'react'
import HomepageCard from '../Component/HomepageCard/HomepageCard.jsx'

class Homepage extends Component {
  render () {
    return (
      <section className='homepage'>
        <div className='container-fluid nopadding'>
          <HomepageCard />
        </div>
      </section>
    )
  }
}

export default Homepage
