import { SELECTORS as s } from '../../support/generic_selector_commands'

context('Add file(s) with PopupCreateFile', function () {
  let workspaceId
  const pngFile1 = 'Linux-Free-PNG.png'
  const pngFile2 = 'artikodin.png'
  const pdfFile1 = 'the_pdf.pdf'

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.fixture('baseWorkspace').then(workspace => {
      workspaceId = workspace.workspace_id
    })
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit(`/ui/workspaces/${workspaceId}/dashboard`)
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('Adds a file to a workspace', () => {
    it('should open the app file with the newly added file', () => {
      cy.getTag({ selectorName: s.WORKSPACE_DASHBOARD })
        .get('[data-cy="contentTypeBtn_contents/file"]')
        .click()

      cy.dropFixtureInDropZone(pngFile1, 'image/png', '.filecontent__form', 'file_exemple1.png')
      cy.getTag({ selectorName: s.CARD_POPUP_BODY })
        .get('[data-cy=popup__createcontent__form__button]')
        .click()
      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .get('.previewcomponent__dloption__icon').should('have.length', 1)
      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .get('#dropdownMenu2').contains('Opened')
    })
  })

  describe('Adds multiples files to a workspace', () => {
    describe('add 2 files not added yet', () => {
      it('should update the workspace content list with the newly added files', () => {
        const fileName1 = 'png_exemple2'
        const fileName2 = 'pdf_exemple2'

        cy.getTag({ selectorName: s.WORKSPACE_DASHBOARD })
          .get('[data-cy="contentTypeBtn_contents/file"]')
          .click()

        cy.dropFixtureInDropZone(pngFile2, 'image/png', '.filecontent__form', `${fileName1}.png`)
        cy.dropFixtureInDropZone(pdfFile1, 'application/pdf', '.filecontent__form', `${fileName2}.pdf`)
        cy.getTag({ selectorName: s.CARD_POPUP_BODY })
          .get('[data-cy=popup__createcontent__form__button]')
          .click()
        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileName1 } })
          .should('be.visible')
        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileName2 } })
          .should('be.visible')
      })
    })

    describe('add 2 files with one already added', () => {
      it('should update the workspace content list with the newly added file without closing the popup in order to display the failed upload', () => {
        const fileName1 = 'png_exemple3'
        const fileName2 = 'pdf_exemple3'

        cy.createFile(pngFile1, 'image/png', `${fileName1}.png`, workspaceId)

        cy.getTag({ selectorName: s.WORKSPACE_DASHBOARD })
          .get('[data-cy="contentTypeBtn_contents/file"]')
          .click()

        cy.dropFixtureInDropZone(pngFile2, 'image/png', '.filecontent__form', `${fileName1}.png`)
        cy.dropFixtureInDropZone(pdfFile1, 'application/pdf', '.filecontent__form', `${fileName2}.pdf`)
        cy.getTag({ selectorName: s.CARD_POPUP_BODY })
          .get('[data-cy=popup__createcontent__form__button]')
          .click()
        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileName2 } })
          .should('be.visible')
        cy.getTag({ selectorName: s.CARD_POPUP_BODY })
          .get('.file__upload__list__item__label')
          .contains(`${fileName1}.png`)
      })
    })

    describe('add 2 files and a third one deleted right before validating the form', () => {
      it('should be able to delete a file before validating the form', () => {
        const fileName1 = 'png_exemple4'
        const fileName2 = 'pdf_exemple4'
        const fileName3 = 'png_exemple4_1'

        cy.getTag({ selectorName: s.WORKSPACE_DASHBOARD })
          .get('[data-cy="contentTypeBtn_contents/file"]')
          .click()

        cy.dropFixtureInDropZone(pngFile2, 'image/png', '.filecontent__form', `${fileName1}.png`)
        cy.dropFixtureInDropZone(pdfFile1, 'application/pdf', '.filecontent__form', `${fileName2}.pdf`)
        cy.dropFixtureInDropZone(pngFile1, 'image/png', '.filecontent__form', `${fileName3}.png`)
        cy.getTag({ selectorName: s.CARD_POPUP_BODY })
          .get('.file__upload__list__item__label')
          .contains(`${fileName3}.png`)
        cy.getTag({ selectorName: s.CARD_POPUP_BODY })
          .get('[data-cy=file__upload__list__item__delete]')
          .first()
          .click()
        cy.getTag({ selectorName: s.CARD_POPUP_BODY })
          .get('[data-cy=popup__createcontent__form__button]')
          .click()
        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileName1 } })
          .should('be.visible')
        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileName2 } })
          .should('be.visible')
        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileName3 } })
          .should('be.not.visible')
      })
    })
  })
})
