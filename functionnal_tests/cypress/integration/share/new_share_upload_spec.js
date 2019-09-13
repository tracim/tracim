import { PAGES } from '../../support/urls_commands'

const fileTitle = 'FileForSearch'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'

const emailInput = '.newUpload__email__input'
const email1 = 'email1@email1.email1'
const email2 = 'email2@email2.email2'
const email3 = 'email1@email3.email3'

let workspaceId

describe('Open the share folder advanced', () => {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace')
      .then(workspace => {
        workspaceId = workspace.workspace_id
        return cy.createFile(fullFilename, contentType, fileTitle, workspaceId)
      })
      .then(data => {
        cy.visitPage({pageName: PAGES.SHARE_FOLDER, params: {workspaceId: workspaceId}})
        cy.get('.share_folder_advanced__content__btnupload').click()
      })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('and clicking on the New button',() => {
    describe('and writing three emails separated by ; and clicking Enter',() =>{
      it('Should separate the emails by new line',() => {
        // INFO - B.L - 2019.09-13 Adds wait to be sure formatting on the input is loaded otherwise it randomly breaks "type"
        cy.wait(1000)
        cy.get(emailInput).type(`${email1};${email2};${email3}`).type('{enter}')
        cy.get(emailInput).contains(`${email1}\n${email2}\n${email3}`).should('be.visible')
      })
    })

    describe('and writing three emails separated by commas and clicking Enter',() =>{
      it('Should separate the emails by new line',() => {
        // INFO - B.L - 2019.09-13 Adds wait to be sure formatting on the input is loaded otherwise it randomly breaks "type"
        cy.wait(1000)
        cy.get(emailInput).type(`${email1},${email2},${email3}`).type('{enter}')
        cy.get(emailInput).contains(`${email1}\n${email2}\n${email3}`).should('be.visible')
      })
    })

    describe('and clicking at Protect by password',() => {
      it('Should show the password input', () => {
        cy.get('.newUpload__password__link').click()
        cy.get('.newUpload__password__wrapper').should('be.visible')
      })

      describe('and writing a password', () => {
        describe('and clicking at see password', () => {
          it('Should show the password', () => {
            cy.get('.newUpload__password__link').click()
            cy.get('.newUpload__password__input').type('Password')
            cy.get('[data-cy=seePassword]').click()
            cy.get('.newUpload__password__input').should('have.value', 'Password')
          })
        })
      })
    })

    describe('and writing a mail',() => {
      describe('and clicking at New button',() => {
        it('Should create share link at the main authorizations page',() => {
          // INFO - B.L - 2019.09-13 Adds wait to be sure formatting on the input is loaded otherwise it randomly breaks "type"
          cy.wait(1000)
          cy.get(emailInput).type(`${email1}`)
          cy.get('.newUpload__newBtn').click()
          cy.get('.shareLink__linkInfos__email').contains(email1).should('be.visible')
        })
      })
    })
  })
})
