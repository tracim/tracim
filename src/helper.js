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
  customClass: 'wsContentPageHtml',
  icon: 'fa fa-file-word-o'
}, {
  name: 'PageMarkdown',
  componentLeft: 'PageMarkdown',
  componentRight: 'undefined',
  customClass: 'wsContentPageMarkdown',
  icon: 'fa fa-file-code-o'
}, {
  name: 'File',
  componentLeft: 'File',
  componentRight: 'undefined',
  customClass: 'wsContentFile',
  icon: 'fa fa-file-text-o'
}, {
  name: 'Thread',
  componentLeft: 'Thread',
  componentRight: 'undefined',
  customClass: 'wsContentThread',
  icon: 'fa fa-comments-o'
}, {
  name: 'Task',
  componentLeft: 'Task',
  componentRight: 'undefined',
  customClass: 'wsContentTask',
  icon: 'fa fa-list-ul'
}, {
  name: 'Issue',
  componentLeft: 'Issue',
  componentRight: 'undefined',
  customClass: 'wsContentIssue',
  icon: 'fa fa-ticket'
}]
