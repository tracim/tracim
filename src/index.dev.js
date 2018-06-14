import React from 'react'
import ReactDOM from 'react-dom'

import PopinFixed from './component/PopinFixed/PopinFixed.jsx'
import PopinFixedHeader from './component/PopinFixed/PopinFixedHeader.jsx'
import PopinFixedOption from './component/PopinFixed/PopinFixedOption.jsx'
import PopinFixedContent from './component/PopinFixed/PopinFixedContent.jsx'

import TextAreaApp from './component/Input/TextAreaApp/TextAreaApp.jsx'
import BtnSwitch from './component/Input/BtnSwitch/BtnSwitch.jsx'

import Timeline from './component/Timeline/Timeline.jsx'
import TimelineDebugData from './component/Timeline/debugData.js'

import Delimiter from './component/Delimiter/Delimiter.jsx'

import CardPopup from './component/CardPopup/CardPopup.jsx'
import CardPopupCreateContent from './component/CardPopup/CardPopupCreateContent.jsx'

ReactDOM.render(
  <div>
    <PopinFixed customClass={`${'randomClass'}`} style={{display: 'none'}}>
      <PopinFixedHeader
        customClass={`${'randomClass'}`}
        icon={'fa fa-file-word-o'}
        name={'test exemple'}
        onClickCloseBtn={() => {}}
      />

      <PopinFixedOption customClass={`${'randomClass'}`} />

      <PopinFixedContent customClass={`${'randomClass'}__contentpage`}>
        <div>
          <Delimiter />
          <span>Here will be the app content. Style is handled by the app (obviously)</span>
          <BtnSwitch />
          <TextAreaApp customClass={'randomClass'} />
        </div>

        <Timeline
          customClass={`${'randomClass'}__contentpage`}
          loggedUser={{
            id: 1,
            name: 'smoi',
            avatar: 'https://www.algoo.fr/static/images/algoo_images/algoo-logo.jpg'
          }}
          timelineData={TimelineDebugData}
        />
      </PopinFixedContent>
    </PopinFixed>

    <CardPopupCreateContent
      onClose={() => {}}
      icon='fa-file-word-o'
      color='#3f52e3'
      title='Exemple of popup create content'
      inputPlaceHolder='Exemple placeholder'
      btnValidateLabel='Valider et créer'
    />
  </div>
  , document.getElementById('content')
)
