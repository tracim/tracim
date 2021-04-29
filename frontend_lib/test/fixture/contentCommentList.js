import { author } from './author.js'
import { CONTENT_TYPE, TIMELINE_TYPE } from '../../src/helper.js'

export const commentList = [{
  author: author,
  raw_content: '<p>first comment</p>',
  content_id: 4,
  created: '2020-01-07T15:26:25Z',
  parent_id: 3,
  content_type: CONTENT_TYPE.COMMENT,
  timelineType: TIMELINE_TYPE.COMMENT
}, {
  author: {
    avatar_url: null,
    public_name: 'Jack Rey',
    user_id: 2
  },
  raw_content: '<p>another comment</p>',
  content_id: 5,
  created: '2020-01-07T15:28:05Z',
  created_raw: '2020-01-07T15:28:05Z',
  parent_id: 3,
  content_type: CONTENT_TYPE.COMMENT,
  timelineType: TIMELINE_TYPE.COMMENT
}]
