import { combineReducers } from 'redux'
import pageHtml from '../plugin/ContentType/PageHtml/pageHtml.js'
import thread from '../plugin/ContentType/Thread/thread.js'

export default combineReducers({
  pageHtml, thread
})
