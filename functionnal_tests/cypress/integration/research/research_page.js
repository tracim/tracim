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

    afterEach(function () {
      cy.cancelXHR()
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
        const pageSubTitle = '[data-cy=layoutPageSubTitle]'

        it('Should display the message with HtmlDocForResearch', () => {
          cy.get(researchInput).type(htmlDocTitle)
          cy.get(researchButton).click()

          cy.get(pageSubTitle).contains(`best results for "${htmlDocTitle}"`).should('be.visible')
        })

        it('Should display the message with the same number as result contents', () => {
          cy.get(researchInput).type(htmlDocTitle)
          cy.get(researchButton).click()

          // TODO - GB - 2019-06-04 - make this test variable for the number of results (don't put "2" as a constant), maybe using a table
          cy.get('[data-cy=content__item]').its('length').should('eq', 2)
          cy.get(pageSubTitle).contains(`2 best results for "${htmlDocTitle}"`).should('be.visible')
        })
      })
    })
  })
})
