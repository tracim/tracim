import { author } from '../author.js'

// DEPRECATED ? - CH - 2020-06-10 - there is a duplicate in frontend_lib/test/fixture/tracimLiveMessage
// this one seems unused
export const commentTlm = {
  is_editable: true,
  content_id: 1,
  parent_id: 2,
  raw_content: 'Hello',
  author,
  created: '2012-02-23T10:28:43.511Z'
}
