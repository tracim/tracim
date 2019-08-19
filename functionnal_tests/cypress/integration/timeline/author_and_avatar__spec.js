describe('Author and avatar are shown in timeline', () => {
  beforeEach(() => {
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

  afterEach(() => {
    cy.cancelXHR()
  })

  it('Avatar is shown in timeline after creation (author)', function () {
    cy.loginAs('users')
    cy.visit(this.documentUrl)
    cy.get('[data-cy=revision_data_1]').within(() => {
      cy.get('.avatar-wrapper')
        .should('have.attr', 'title', this.user.public_name)
      cy.get('.avatar').should('have.text', 'JD')
    })
  })

  it('Avatar is shown in timeline after update content (author)', function () {
    cy.updateHtmlDocument(
      this.document.content_id,
      this.document.workspace_id,
      'new text',
      'lal'
    )
    cy.loginAs('users')
    cy.visit(this.documentUrl)
    cy.get('[data-cy=revision_data_2]').within(() => {
      cy.get('.avatar-wrapper')
        .should('have.attr', 'title', this.user.public_name)
      cy.get('.avatar').should('have.text', 'JD')
    })
  })

  it('Avatar is shown in timeline after changing status (author)', function () {
    cy.changeHtmlDocumentStatus(
      this.document.content_id,
      this.document.workspace_id,
      'closed-validated'
    )
    cy.loginAs('users')
    cy.visit(this.documentUrl)
    cy.get('[data-cy=revision_data_2]').within(() => {
      cy.get('.avatar-wrapper')
        .should('have.attr', 'title', this.user.public_name)
      cy.get('.avatar').should('have.text', 'JD')
    })
  })

  it('Avatar is shown in timeline after update content (not author)', function () {
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
      cy.get('.avatar-wrapper')
        .should('have.attr', 'title', 'Global manager')
      cy.get('.avatar').should('have.text', 'GM')
    })
  })

  it('Avatar is shown in timeline after changing status (not author)', function () {
    cy.logout()
    cy.loginAs('administrators')
    cy.changeHtmlDocumentStatus(
      this.document.content_id,
      this.document.workspace_id,
      'closed-validated'
    )
    cy.visit(this.documentUrl)
    cy.get('[data-cy=revision_data_2]').within(() => {
      cy.get('.avatar-wrapper')
        .should('have.attr', 'title', 'Global manager')
      cy.get('.avatar').should('have.text', 'GM')
    })
  })
})
