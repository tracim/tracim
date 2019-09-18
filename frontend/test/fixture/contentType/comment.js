import {open} from '../contentStatus/open.js'
import {validated} from '../contentStatus/validated.js'
import {cancelled} from '../contentStatus/cancelled.js'
import {deprecated} from '../contentStatus/deprecated.js'

export const comment = {
  label: 'Comment',
  slug: 'comment',
  faIcon: '',
  hexcolor: '',
  creationLabel: 'Comment',
  availableStatus: [
    open,
    validated,
    cancelled,
    deprecated
  ]
}
