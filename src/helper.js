export const FETCH_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
}

export const FILE_TYPE = [{
  name: 'pageHtml',
  customClass: 'wsFilePageHtml',
  icon: 'fa fa-file-word-o'
}, {
  name: 'pageMarkdown',
  customClass: 'wsFilePageMarkdown',
  icon: 'fa fa-file-code-o'
}, {
  name: 'file',
  customClass: 'wsFileFile',
  icon: 'fa fa-file-text-o'
}, {
  name: 'thread',
  customClass: 'wsFileThread',
  icon: 'fa fa-comments-o'
}, {
  name: 'task',
  customClass: 'wsFileTask',
  icon: 'fa fa-list-ul'
}, {
  name: 'issue',
  customClass: 'wsFileIssue',
  icon: 'fa fa-ticket'
}]
