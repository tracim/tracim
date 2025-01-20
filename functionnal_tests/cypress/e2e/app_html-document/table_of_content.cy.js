describe('App note Table of Content', () => {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      const rawContent = `
        <h1>first title</h1>
        <p>some text 1</p>
        <h2>second subtitle</h2>
        <p>some text 2</p>
        <h1>third title</h1>
        <p>some text 3</p>
        <h1>fourth title</h1>
      `
      cy.createHtmlDocument('Some title', workspace.workspace_id, null, rawContent)
        .then(newContent => {
          cy.visit(`/ui/contents/${newContent.body.content_id}`)
        })
    })
  })

  it('should display the table of content on mouse over', () => {
    cy.get('#tableOfContentButtonPopoverAnchor').trigger('mouseover')
    cy.get('.tableOfContent__toc a').should('have.length', 4)
  })
})
