import { thread as threadApp } from '../app/thread.js'
import { statusList } from '../status.js'

const { label, slug, faIcon, hexcolor } = threadApp

export const thread = {
  label,
  slug,
  faIcon,
  hexcolor,
  creationLabel: 'Start a topic',
  availableStatus: statusList
}
