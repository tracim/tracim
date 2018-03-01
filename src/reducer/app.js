import { combineReducers } from 'redux'
import appDatabase from '../app/index.js'

const reducerList = {}
appDatabase.forEach(p => (reducerList[p.name] = p.reducer))

export default combineReducers({
  ...reducerList
})
