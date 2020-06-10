describe('Author and avatar are shown in the timeline', () => {
  beforeEach(() => {
    cy.resetDB()
    cy.setupBaseDB()
    const title = 'A title'
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

  afterEach(() => {
    cy.cancelXHR()
  })

  it('Author is shown in the timeline after creation', function () {
    cy.loginAs('users')
    cy.visit(this.documentUrl)
    cy.get('[data-cy=revision_data_1]').within(() => {
      cy.get('.revision__data__infos__author').contains('John Doe').should('be.visible')
    })
  })

  it('Author is shown in the timeline after update content', function () {
    cy.updateHtmlDocument(
      this.document.content_id,
      this.document.workspace_id,
      'new text',
      'lal'
    )
    cy.loginAs('users')
    cy.visit(this.documentUrl)
    cy.get('[data-cy=revision_data_2]').within(() => {
      cy.get('.revision__data__infos__author').contains('John Doe').should('be.visible')
    })
  })

  it('Author is shown in the timeline after changing status', function () {
    cy.changeHtmlDocumentStatus(
      this.document.content_id,
      this.document.workspace_id,
      'closed-validated'
    )
    cy.loginAs('users')
    cy.visit(this.documentUrl)
    cy.get('[data-cy=revision_data_2]').within(() => {
      cy.get('.revision__data__infos__author').contains('John Doe').should('be.visible')
    })
  })

  it('User is shown in the timeline after update content (not author)', function () {
    cy.logout()
    cy.loginAs('administrators')
    cy.updateHtmlDocument(
      this.document.content_id,
      this.document.workspace_id,
      'new text',
      'new title'
    )
    cy.visit(this.documentUrl)
    cy.get('[data-cy=revision_data_2]').within(() => {
      cy.get('.revision__data__infos__author').contains('Global manager').should('be.visible')
    })
  })

  it('User is shown in the timeline after changing status (not author)', function () {
    cy.logout()
    cy.loginAs('administrators')
    cy.changeHtmlDocumentStatus(
      this.document.content_id,
      this.document.workspace_id,
      'closed-validated'
    )
    cy.visit(this.documentUrl)
    cy.get('[data-cy=revision_data_2]').within(() => {
      cy.get('.revision__data__infos__author').contains('Global manager').should('be.visible')
    })
  })
})
