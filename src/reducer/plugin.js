import { combineReducers } from 'redux'
import pluginDatabase from '../plugin/index.js'

const reducerList = {}
pluginDatabase.forEach(p => (reducerList[p.name] = p.reducer))

export default combineReducers({
  ...reducerList
})
