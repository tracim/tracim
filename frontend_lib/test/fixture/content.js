import { author } from './author.js'
import { file } from './app/file.js'
import { comment } from './contentType/comment.js'
import { status } from './status.js'

export const content = {
  actives_shares: 0,
  author: author,
  content_id: 6,
  content_namespace: 'content',
  content_type: file.slug,
  created: '2020-01-07T15:59:17.003Z',
  current_revision_id: 12,
  file_extension: '.txt',
  filename: 'fileNameExample.txt',
  has_jpeg_preview: true,
  has_pdf_preview: true,
  is_archived: false,
  is_deleted: false,
  is_editable: true,
  label: 'Intervention Report 12',
  last_modifier: author,
  mimetype: 'image/jpeg',
  modified: '2020-01-07T15:59:17.003Z',
  page_nb: 1,
  parent_id: 34,
  raw_content: '',
  show_in_ui: true,
  size: 1024,
  slug: 'intervention-report-12',
  status: status.OPEN.slug,
  sub_content_types: [
    comment.slug
  ],
  workspace_id: 19
}
