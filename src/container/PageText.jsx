import React, { Component } from 'react'
import PopinFixed from '../component/common/PopinFixed/PopinFixed'
import PopinFixedHeader from '../component/common/PopinFixed/PopinFixedHeader.jsx'
import PopinFixedOption from '../component/common/PopinFixed/PopinFixedOption.jsx'
import PopinFixedContent from '../component/common/PopinFixed/PopinFixedContent.jsx'
import Timeline from '../component/Timeline.jsx'

class PageText extends Component {
  render () {
    return (
      <PopinFixed customClass={'wsFileText'}>
        <PopinFixedHeader
          customClass='wsFileText'
          icon='fa fa-file-text-o'
          name='Facture 57840 - Jean-michel Chevalier - 04/09/2017'
        />

        <PopinFixedOption customClass={'wsFileText'} />

        <PopinFixedContent customClass={'wsFileText__contentpage'}>
          <Timeline customClass={'wsFileText__contentpage'} />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default PageText

/*
      <div className={classnames('wsFileText wsFileGeneric', {'visible': this.props.visible})}>

        <div className='wsFileText__contentpage wsFileGeneric__contentpage'>
          <div className='wsFileText__contentpage__textnote'>
            <div className='wsFileText__contentpage__textnote__latestversion'>
              Dernière version : v3
            </div>
            <div className='wsFileText__contentpage__textnote__title'>
              Titre de 30px de font size
            </div>
            <div className='wsFileText__contentpage__textnote__data'>
              Labore tempor sunt id quis quis velit ut officia amet ut
              adipisicing in in commodo exercitation cupidatat culpa
              eiusmo dolor consectetur dolor ut proident proident culpamet
              denim consequat in sit ex ullamco duis.
              <br />
              Labore tempor sunt id quis quis velit ut officia amet ut
              adipisicing in in commodo exercitation cupidatat culpa
              eiusmo dolor consectetur dolor ut proident proident culpamet
              denim consequat in sit ex ullamco duis.
              <br />
              Labore tempor sunt id quis quis velit ut officia amet ut
              adipisicing in in commodo exercitation cupidatat culpa
              eiusmo dolor consectetur dolor ut proident proident culpamet
              denim consequat in sit ex ullamco duis.
              <br />
              Labore tempor sunt id quis quis velit ut officia amet ut
              adipisicing in in commodo exercitation cupidatat culpa
              eiusmo dolor consectetur dolor ut proident proident culpamet
              denim consequat in sit ex ullamco duis.
            </div>
          </div>
          <div className='wsFileText__contentpage__wrapper wsFileGeneric__wrapper'>

          </div>
        </div>
      </div>
    )
  }
}

export default PageText
*/
