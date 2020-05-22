import { file } from './file.js'
import { fixtureCommentList, fixtureRevisionList } from 'tracim_frontend_lib'
import { shareList } from './shareList.js'

const content = {
  file,
  shareList,
  commentList: fixtureCommentList,
  revisionList: fixtureRevisionList
}

export default content
