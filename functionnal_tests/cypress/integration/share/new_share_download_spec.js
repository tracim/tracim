import { PAGES } from '../../support/urls_commands'

const fileTitle = 'FileForSearch'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'

const emailInput = '.shareDownload__email__input'
const email1 = 'email1@email1.email1'
const email2 = 'email2@email2.email2'
const email3 = 'email1@email3.email3'

let workspaceId
let contentId

describe('Open a file', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId)
        .then(newContent => {
          contentId = newContent.content_id
          cy.updateFile(fullFilename, contentType, workspaceId, newContent.content_id, newContent.filename)
        })
    })
    cy.wait(2000)
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visitPage({
      pageName: PAGES.CONTENT_OPEN, 
      params: { workspaceId: workspaceId, contentType: 'file', contentId: contentId }
    })
    cy.get('.wsContentGeneric__content__right__header .fa-share-alt').click()
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('and clicking on the share icon', () => {
    describe('and clicking on the New button',() => {
      describe('and writing three emails separated by space and clicking Enter',() =>{
        it('Should separate the emails by new line',() => {
          cy.get(emailInput).type(`${email1} ${email2} ${email3}`).type('{enter}')
          cy.get(emailInput).contains(`${email1}\n${email2}\n${email3}`).should('be.visible')
        })
      })

      describe('and writing three emails separated by commas and clicking Enter',() =>{
        it('Should separate the emails by new line',() => {
          cy.get(emailInput).type(`${email1},${email2},${email3}`).type('{enter}')
          cy.get(emailInput).contains(`${email1}\n${email2}\n${email3}`).should('be.visible')
        })
      })

      describe('and clicking at Protect by password',() => {
        it('Should show the password input',() => {
          cy.get('.shareDownload__password__link').click()
          cy.get('.shareDownload__password__wrapper').should('be.visible')
        })

        describe('and writing a password',() => {
          describe('and clicking at see password',() => {
            it('Should show the password',() => {
              cy.get('.shareDownload__password__link').click()
              cy.get('.shareDownload__password__input').type('Password')
              cy.get('[data-cy=seePassword]').click()
              cy.get('.shareDownload__password__input').should('have.value','Password')
            })
          })
        })
      })

      describe('and writing a mail',() => {
        describe('and clicking at New button',() => {
          it('Should create share link at the main authorizations page',() => {
            cy.get(emailInput).type(`${email1}`)
            cy.get('.shareDownload__newBtn').click()
            cy.get('.shareLink__linkInfos__email').contains(email1).should('be.visible')
          })
        })
      })
    })
  })
})
