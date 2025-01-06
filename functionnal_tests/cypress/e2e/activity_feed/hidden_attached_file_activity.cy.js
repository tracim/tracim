import { PAGES } from '../../support/urls_commands'

let workspaceId
let publicationId
const publicationLabel = 'publication'
const fileTitle = 'FileTitle'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'

describe('Recent activities page', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createPublication(publicationLabel, workspaceId).then(publication => {
        publicationId = publication.content_id
        cy.createFile(fullFilename, contentType, fileTitle, workspaceId, publicationId).then(() => {
          cy.visitPage({ pageName: PAGES.WORKSPACE_RECENT_ACTIVITIES, params: { workspaceId } })
        })
      })
    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('should show news', () => {
    cy.contains('.feedItemHeader', publicationLabel)
      .should('be.visible')
  })

  it('should  not show news attached file', () => {
    cy.visitPage({ pageName: PAGES.WORKSPACE_RECENT_ACTIVITIES, params: { workspaceId } })
    cy.get('.feedItemHeader').should('exist')
    cy.contains('.feedItemHeader', fileTitle)
      .should('not.exist')
  })
})
