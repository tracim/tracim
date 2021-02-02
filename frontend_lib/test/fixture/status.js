const OPEN = {
  slug: 'open',
  label: 'Opened',
  faIcon: 'far fa-square',
  hexcolor: '#3f52e3',
  globalStatus: 'open'
}
const VALIDATED = {
  slug: 'closed-validated',
  label: 'Validated',
  faIcon: 'far fa-check-square',
  hexcolor: '#008000',
  globalStatus: 'closed'
}
const CLOSED = {
  slug: 'closed-unvalidated',
  label: 'Cancelled',
  faIcon: 'fas fa-times',
  hexcolor: '#f63434',
  globalStatus: 'closed'
}
const DEPRECATED = {
  slug: 'closed-deprecated',
  label: 'Deprecated',
  faIcon: 'fas fa-exclamation-triangle',
  hexcolor: '#ababab',
  globalStatus: 'closed'
}

export const status = { OPEN, VALIDATED, CLOSED, DEPRECATED }
export const statusList = [OPEN, VALIDATED, CLOSED, DEPRECATED]
