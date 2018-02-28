import React from 'react'
import ReactDOM from 'react-dom'

import PopinFixed from './component/PopinFixed/PopinFixed.jsx'
import PopinFixedHeader from './component/PopinFixed/PopinFixedHeader.jsx'
import PopinFixedOption from './component/PopinFixed/PopinFixedOption.jsx'
import PopinFixedContent from './component/PopinFixed/PopinFixedContent.jsx'

import Timeline from './component/Timeline.jsx'

ReactDOM.render(
  <PopinFixed customClass={`${'randomClass'}`}>
    <PopinFixedHeader
      customClass={`${'randomClass'}`}
      icon={'fa fa-file-word-o'}
      name={'test exemple'}
      onClickCloseBtn={() => {}}
    />

    <PopinFixedOption customClass={`${'randomClass'}`} />

    <PopinFixedContent customClass={`${'randomClass'}__contentpage`}>
      <div>Here will be the plugin content. Style is handled by the plugin (obviously)</div>

      <Timeline
        customClass={`${'randomClass'}__contentpage`}
        key={'pageHtml__timeline'}
      />
    </PopinFixedContent>
  </PopinFixed>
  , document.getElementById('content')
)
