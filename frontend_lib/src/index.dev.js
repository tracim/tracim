import React from 'react'
import ReactDOM from 'react-dom'

import PopinFixed from './component/PopinFixed/PopinFixed.jsx'
import PopinFixedHeader from './component/PopinFixed/PopinFixedHeader.jsx'
import PopinFixedOption from './component/PopinFixed/PopinFixedOption.jsx'
import PopinFixedContent from './component/PopinFixed/PopinFixedContent.jsx'

// import TextAreaApp from './component/Input/TextAreaApp/TextAreaApp.jsx'
// import BtnSwitch from './component/Input/BtnSwitch/BtnSwitch.jsx'
// import Checkbox from './component/Input/Checkbox.jsx'

import Timeline from './component/Timeline/Timeline.jsx'
import TimelineDebugData from './component/Timeline/debugData.js'

// import Delimiter from './component/Delimiter/Delimiter.jsx'
//
// import CardPopup from './component/CardPopup/CardPopup.jsx'
// import CardPopupCreateContent from './component/CardPopup/CardPopupCreateContent.jsx'

// import NewVersionButton from './component/OptionComponent/NewVersionBtn.jsx'
// import ArchiveDeleteContent from './component/OptionComponent/ArchiveDeleteContent.jsx'

ReactDOM.render(
  <div style={{width: '1200px'}}>
    <PopinFixed customClass={`${'randomClass'}`} style={{width: '1200px'}}>
      <PopinFixedHeader
        customClass={`${'randomClass'}`}
        faIcon={'fa fa-file-word-o'}
        name={'test exemple'}
        onClickCloseBtn={() => {}}
      />

      <PopinFixedOption
        customClass={`${'randomClass'}`}
        onClickNewVersionBtn={() => {}}
        selectedStatus={{
          label: 'Open',
          slug: 'open',
          faIcon: 'square-o',
          hexcolor: '#3f52e3',
          globalStatus: 'open'
        }}
        availableStatus={[{
          label: 'Open',
          slug: 'open',
          faIcon: 'square-o',
          hexcolor: '#3f52e3',
          globalStatus: 'open'
        }, {
          label: 'Validated',
          slug: 'closed-validated',
          faIcon: 'check-square-o',
          hexcolor: '#008000',
          globalStatus: 'closed'
        }, {
          label: 'Cancelled',
          slug: 'closed-unvalidated',
          faIcon: 'close',
          hexcolor: '#f63434',
          globalStatus: 'closed'
        }, {
          label: 'Deprecated',
          slug: 'closed-deprecated',
          faIcon: 'warning',
          hexcolor: '#ababab',
          globalStatus: 'closed'
        }]}
        onChangeStatus={newStatus => console.log('newStatus', newStatus)}
        onClickArchive={() => console.log('btn archive clicked')}
        onClickDelete={() => console.log('btn delete clicked')}
      />

      <PopinFixedContent customClass={`${'randomClass'}__contentpage`} style={{width: '100%'}}>
        <div className='wsContentGeneric__content__left' />

        <Timeline
          showHeader
          customClass={`${'randomClass'}__contentpage`}
          customColor={'#3f52e3'}
          loggedUser={{
            user_id: 1,
            username: 'Smoi',
            firstname: 'Côme',
            lastname: 'Stoilenom',
            email: 'osef@algoo.fr',
            avatar_url: 'https://avatars3.githubusercontent.com/u/11177014?s=460&v=4',
            idRoleUserWorkspace: 8
          }}
          timelineData={TimelineDebugData.map(item => item.timelineType === 'comment'
            ? {
              ...item,
              author: {
                ...item.author,
                avatar_url: item.author.avatar_url
                  ? item.author.avatar_url
                  : ''
              }
            }
            : item
          )}
          newComment={''}
          disableComment={false}
          wysiwyg={false}
          onChangeNewComment={() => {}}
          onClickValidateNewCommentBtn={() => {}}
          onClickWysiwygBtn={() => {}}
          onClickRevisionBtn={() => {}}
          shouldScrollToBottom={true}
        />
      </PopinFixedContent>
    </PopinFixed>
  </div>
  , document.getElementById('content')
)
