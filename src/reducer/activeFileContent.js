import { FILE_CONTENT } from '../action-creator.sync.js'

export default function activeFileContent (state = {
  display: false,
  type: '',
  title: '',
  status: ''
}, action) {
  switch (action.type) {
    case `Set/${FILE_CONTENT}/Active`:
      return {...action.file, display: true}

    case `Set/${FILE_CONTENT}/Hide`:
      return {...state, display: false}

    default:
      return state
  }
}
