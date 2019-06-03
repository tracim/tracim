const htmlDocTitle = 'HtmlDocForResearch'
const researchInput = '.research > [data-cy=research__text]'
const researchButton = '.research > [data-cy=research__btn]'
const htmlDocTitleLong = 'HtmlDocForResearchLong'

let workspaceId

describe('Research page', () => {
  describe('Research input', () => {
    before(function () {
        cy.resetDB()
        cy.setupBaseDB()
        cy.loginAs('users')
        cy.fixture('baseWorkspace').as('workspace').then(workspace => {
          workspaceId = workspace.workspace_id
          cy.createHtmlDocument(htmlDocTitle, workspaceId)
          cy.createHtmlDocument(htmlDocTitleLong, workspaceId)
        })
    })

    beforeEach(function () {
      cy.loginAs('users')
      cy.visit('/ui')
    })

    it('Should redirect to the research result page with click', () => {
      cy.get(researchInput).type(htmlDocTitle)
      cy.get(researchButton).click()
      cy.url().should('include', '/research-result')
      cy.get('.ResearchResult__title').should('be.visible')
    })

    it('Should redirect to the research result page with enter', () => {
      cy.get(researchInput).type(htmlDocTitle).type('{enter}')
      cy.url().should('include', '/research-result')
      cy.get('.ResearchResult__title').should('be.visible')
    })

    it('Should be disabled if it is empty', () => {
      cy.get(researchInput).clear()
      cy.get(researchButton).should('be.disabled')
    })

    describe('Typing HtmlDocForResearch and validating', () => {
      it('Should display HtmlDocForResearch in the research input', () => {
        cy.get(researchInput).type(htmlDocTitle)
        cy.get(researchButton).click()

        cy.get(researchInput).should('have.value', htmlDocTitle)
      })

      describe('The subtitle', () => {
        const pageTitle = '[data-cy=page__title__research]'

        it('Should display the message with HtmlDocForResearch', () => {
          cy.get(researchInput).type(htmlDocTitle)
          cy.get(researchButton).click()

          cy.get(pageTitle).contains(`best results for "${htmlDocTitle}"`)
        })

        it('Should display the message with the same number as result contents', () => {
          cy.get(researchInput).type(htmlDocTitle)
          cy.get(researchButton).click()

          // TODO make this test variable for the number of results (don't put "2" as a constant)
          cy.get('[data-cy=content__item]').its('length').should('eq', 2)
          cy.get(pageTitle).contains(`2 best results for "${htmlDocTitle}"`)
        })
      })
    })
  })
})
