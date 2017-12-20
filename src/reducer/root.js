import { combineReducers } from 'redux'
import user from './user.js'
import workspace from './workspace.js'

const rootReducer = combineReducers({ user, workspace })

export default rootReducer
