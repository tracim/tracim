import React from 'react'
import ReactDOM from 'react-dom'
import './i18n.js'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { appContentFactory } from '../src/appContentFactory.js'

const testComponent = props => {
  props.appContentSaveNewComment(
    { content_id: 1, workspace_id: 1 },
    false,
    'new comment that includes a mention here @admin which should be wrapped',
    () => { console.log('setState called') },
    'html-document',
    'foo'
  )

  props.appContentSaveNewComment(
    { content_id: 2, workspace_id: 1 },
    true,
    'Another comment that contains HTML and a mention @admin which should be wrapped too',
    () => { console.log('setState called') },
    'html-document',
    'foo'
  )
  return (
    <div>
      I'm a dummy test component
    </div>
  )
}
const WrapperTestComponent = appContentFactory(testComponent)

ReactDOM.render(
  <div style={{ width: '1200px' }}>
    <WrapperTestComponent />
  </div>
  , document.getElementById('content')
)
