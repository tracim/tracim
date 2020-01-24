import { author } from './author.js'

export const commentList = [{
  author: author,
  raw_content: '<p>first comment</p>',
  content_id: 4,
  created: '2020-01-07T15:26:25Z',
  parent_id: 3
}, {
  author: {
    avatar_url: null,
    public_name: 'Jack Rey',
    user_id: 2
  },
  raw_content: '<p>another comment</p>',
  content_id: 5,
  created: '2020-01-07T15:28:05Z',
  parent_id: 3
}]
