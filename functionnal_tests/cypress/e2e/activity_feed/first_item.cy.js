import { PAGES } from '../../support/urls_commands'

let workspaceId

let fileId
const fileTitle = 'FileTitle'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'

let threadId
const threadTitle = 'ThreadTitle'

const commentContent = 'comment'

describe('The Personal recent activities page', () => {

  beforeEach(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId).then(content => {
        fileId = content.content_id
      })
      cy.createThread(threadTitle, workspaceId).then(content => threadId = content.content_id)
      cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, waitForTlm: true })
    })
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  // TODO - MP - 02-09-2023 - Unstable test due to race condition
  // See https://github.com/tracim/tracim/issues/3866
  // See https://github.com/tracim/tracim/issues/3392
  it.skip('should display refresh button when a comment is the first comment of a thread', () => {
    cy.createComment(workspaceId, fileId, commentContent).then(() => {
      cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, waitForTlm: true })
      cy.get('[data-cy=activityList__item]').first().then(() => {
        cy.contains('.feedItemHeader__title', fileTitle)
      })
      cy.createComment(workspaceId, threadId, commentContent).then(() => {
        cy.get('[data-cy=activityList__refresh]').should('be.visible').click()
        cy.get('[data-cy=activityList__item]').first().then(() => {
          cy.contains('.feedItemHeader__title', threadTitle)
        })
      })
    })
  })

  // TODO - MP - 02-09-2023 - Unstable test due to race condition
  // See https://github.com/tracim/tracim/issues/3866
  // See https://github.com/tracim/tracim/issues/3392
  it.skip('should display refresh button when a file is the first comment of a thread', () => {
    cy.createFile(fullFilename, contentType, fileTitle, workspaceId, fileId).then(() => {
      cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, waitForTlm: true })
      cy.get('[data-cy=activityList__item]').first().then(() => {
        cy.contains('.feedItemHeader__title', fileTitle)
      })
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId, threadId).then(() => {
        cy.get('[data-cy=activityList__refresh]').should('be.visible')
      })
    })
  })
})
