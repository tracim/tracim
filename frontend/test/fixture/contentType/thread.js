import { thread as threadApp } from '../app/thread.js'
import { open } from '../contentStatus/open.js'
import { validated } from '../contentStatus/validated.js'
import { cancelled } from '../contentStatus/cancelled.js'
import { deprecated } from '../contentStatus/deprecated.js'

const { label, faIcon, hexcolor } = threadApp

export const thread = {
  label,
  slug: 'thread',
  faIcon,
  hexcolor,
  creationLabel: 'Start a topic',
  availableStatuses: [
    open,
    validated,
    cancelled,
    deprecated
  ]
}
