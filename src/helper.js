export const FETCH_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
}

export const FILE_TYPE = [{
  name: 'PageHtml',
  componentLeft: 'PageHtml',
  componentRight: 'Timeline',
  customClass: 'wsFilePageHtml',
  icon: 'fa fa-file-word-o'
}, {
  name: 'PageMarkdown',
  componentLeft: 'PageMarkdown',
  componentRight: 'undefined',
  customClass: 'wsFilePageMarkdown',
  icon: 'fa fa-file-code-o'
}, {
  name: 'File',
  componentLeft: 'File',
  componentRight: 'undefined',
  customClass: 'wsFileFile',
  icon: 'fa fa-file-image-o'
}, {
  name: 'Thread',
  componentLeft: 'Thread',
  componentRight: 'undefined',
  customClass: 'wsFileThread',
  icon: 'fa fa-comments-o'
}, {
  name: 'Task',
  componentLeft: 'Task',
  componentRight: 'undefined',
  customClass: 'wsFileTask',
  icon: 'fa fa-list-ul'
}, {
  name: 'Issue',
  componentLeft: 'Issue',
  componentRight: 'undefined',
  customClass: 'wsFileIssue',
  icon: 'fa fa-ticket'
}]
