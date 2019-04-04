const statusMessage = 'Status changed to'

describe('New statuses are visible in timeline', () => {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    let title = 'A title'
    cy.loginAs('users').as('user')
    cy.fixture('baseWorkspace').as('workspace')
      .then((workspace) => {
        cy.createHtmlDocument(title, workspace.workspace_id)
      }).then((document) => {
        cy.wrap(document).as('document')
        cy
          .wrap(`/ui/workspaces/${document.workspace_id}/contents/html-document/${document.content_id}`)
          .as('documentUrl')
      })
  })
  it('show new status open', function () {
    cy.changeHtmlDocumentStatus(
      this.document.content_id,
      this.document.workspace_id,
      'closed-validated'
    )
    cy.changeHtmlDocumentStatus(
      this.document.content_id,
      this.document.workspace_id,
      'open'
    )
    cy.visit(this.documentUrl)
    cy.get('[data-cy=revision_data_3]').within(() => {
      cy.contains(`${statusMessage} Open`)
    })
  })

  it('show new status validated', function () {
    cy.changeHtmlDocumentStatus(
      this.document.content_id,
      this.document.workspace_id,
      'closed-validated'
    )
    cy.visit(this.documentUrl)
    cy.get('[data-cy=revision_data_2]').within(() => {
      cy.contains(`${statusMessage} Validated`)
    })
  })

  it('show new status unvalidated', function () {
    cy.changeHtmlDocumentStatus(
      this.document.content_id,
      this.document.workspace_id,
      'closed-unvalidated'
    )
    cy.visit(this.documentUrl)
    cy.get('[data-cy=revision_data_2]').within(() => {
      cy.contains(`${statusMessage} Cancelled`)
    })
  })

  it('show new status deprecated', function () {
    cy.changeHtmlDocumentStatus(
      this.document.content_id,
      this.document.workspace_id,
      'closed-deprecated'
    )
    cy.visit(this.documentUrl)
    cy.get('[data-cy=revision_data_2]').within(() => {
      cy.contains(`${statusMessage} Deprecated`)
    })
  })
})
