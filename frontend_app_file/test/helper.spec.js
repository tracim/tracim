import { expect } from 'chai'
import { isVideoMimeTypeAndIsAllowed } from '../src/helper.js'

describe('helper.js', () => {
  describe('isVideoMimeTypeAndIsAllowed ()', () => {
    describe('if the mime type starts with "video/"', () => {
      it(`should return true for "video/mp4"`, () => {
        const mimeType = 'video/mp4'
        expect(isVideoMimeTypeAndIsAllowed(mimeType, [])).to.equal(true)
      })

      it(`should return true for an unknown video mime type like "video/anUnknownVideoFormat"`, () => {
        const mimeType = 'video/anUnknownVideoFormat'
        expect(isVideoMimeTypeAndIsAllowed(mimeType, [])).to.equal(true)
      })

      it('should return false for "video/mp4" if mime type is in disallowed list', () => {
        const mimeType = 'video/mp4'
        expect(isVideoMimeTypeAndIsAllowed(mimeType, [mimeType])).to.equal(false)
      })
    })

    describe('if the mime type does not starts with "video/"', () => {
      it('should return false for "image/png"', () => {
        const mimeType = 'image/png'
        expect(isVideoMimeTypeAndIsAllowed(mimeType, [])).to.equal(false)
      })

      it('should return false for "image/png" if mime type is in disallowed list', () => {
        const mimeType = 'image/png'
        expect(isVideoMimeTypeAndIsAllowed(mimeType, [mimeType])).to.equal(false)
      })
    })
  })
})
