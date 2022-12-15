import { expect } from 'chai'
import { CONTENT_TYPE } from '../src/helper.js'
import {
  putFoldersAtListBeginning,
  SORT_BY,
  SORT_ORDER,
  sortListBy,
  sortListByMultipleCriteria,
  sortTimelineByDate
} from '../src/sortListHelper.js'

describe('sortListHelper.js', () => {
  describe('Function sortListByMultipleCriteria()', () => {
    it('should naturally sort the array of space if the params are LABEL than ID', () => {
      const spaceList = [
        { id: 1, label: 'content 0' },
        { id: 3, label: 'content 1' },
        { id: 21, label: 'content 10' },
        { id: 23, label: 'content 11' },
        { id: 25, label: 'content 12' },
        { id: 27, label: 'content 13' },
        { id: 29, label: 'content 14' },
        { id: 31, label: 'content 15' },
        { id: 33, label: 'content 16' },
        { id: 35, label: 'content 17' },
        { id: 37, label: 'content 18' },
        { id: 39, label: 'content 19' },
        { id: 5, label: 'content 2' },
        { id: 41, label: 'content 20' },
        { id: 7, label: 'content 3' },
        { id: 9, label: 'content 4' },
        { id: 11, label: 'content 5' },
        { id: 13, label: 'content 6' },
        { id: 15, label: 'content 7' },
        { id: 17, label: 'content 8' },
        { id: 19, label: 'content 9' },
        { id: 36, label: 'content 9b' },
        { id: 43, label: 'content 9a' }
      ]

      const spaceListSorted = [
        { id: 1, label: 'content 0' },
        { id: 3, label: 'content 1' },
        { id: 5, label: 'content 2' },
        { id: 7, label: 'content 3' },
        { id: 9, label: 'content 4' },
        { id: 11, label: 'content 5' },
        { id: 13, label: 'content 6' },
        { id: 15, label: 'content 7' },
        { id: 17, label: 'content 8' },
        { id: 19, label: 'content 9' },
        { id: 43, label: 'content 9a' },
        { id: 36, label: 'content 9b' },
        { id: 21, label: 'content 10' },
        { id: 23, label: 'content 11' },
        { id: 25, label: 'content 12' },
        { id: 27, label: 'content 13' },
        { id: 29, label: 'content 14' },
        { id: 31, label: 'content 15' },
        { id: 33, label: 'content 16' },
        { id: 35, label: 'content 17' },
        { id: 37, label: 'content 18' },
        { id: 39, label: 'content 19' },
        { id: 41, label: 'content 20' }
      ]

      expect(sortListByMultipleCriteria(spaceList, [SORT_BY.LABEL, SORT_BY.ID], SORT_ORDER.ASCENDING, 'en'))
        .to.deep.equal(spaceListSorted)
    })

    it('should sort DESCENDING the array if it is a param', () => {
      const spaceList = [
        { number_of_members: 1, access_type: 'content 0', statusSlug: 'open' },
        { number_of_members: 3, access_type: 'content 1', statusSlug: 'closed-validated' },
        { number_of_members: 21, access_type: 'content 10', statusSlug: 'closed-deprecated' },
        { number_of_members: 23, access_type: 'content 11', statusSlug: 'open' },
        { number_of_members: 25, access_type: 'content 12', statusSlug: 'closed-validated' },
        { number_of_members: 27, access_type: 'content 13', statusSlug: 'open' },
        { number_of_members: 29, access_type: 'content 11', statusSlug: 'open' },
        { number_of_members: 31, access_type: 'content 15', statusSlug: 'closed-unvalidated' },
        { number_of_members: 33, access_type: 'content 0', statusSlug: 'closed-validated' },
        { number_of_members: 35, access_type: 'content 17', statusSlug: 'open' },
        { number_of_members: 37, access_type: 'content 18', statusSlug: 'open' },
        { number_of_members: 39, access_type: 'content 19', statusSlug: 'closed-deprecated' },
        { number_of_members: 5, access_type: 'content 2', statusSlug: 'open' },
        { number_of_members: 41, access_type: 'content 20', statusSlug: 'open' },
        { number_of_members: 7, access_type: 'content 3', statusSlug: 'open' },
        { number_of_members: 9, access_type: 'content 4', statusSlug: 'closed-unvalidated' },
        { number_of_members: 11, access_type: 'content 5', statusSlug: 'open' },
        { number_of_members: 13, access_type: 'content 6', statusSlug: 'closed-unvalidated' },
        { number_of_members: 15, access_type: 'content 6', statusSlug: 'open' },
        { number_of_members: 17, access_type: 'content 8', statusSlug: 'open' },
        { number_of_members: 19, access_type: 'content 9', statusSlug: 'closed-validated' },
        { number_of_members: 36, access_type: 'content 9b', statusSlug: 'open' },
        { number_of_members: 43, access_type: 'content 9a', statusSlug: 'closed-deprecated' }
      ]

      const spaceListSorted = [
        { number_of_members: 39, access_type: 'content 19', statusSlug: 'closed-deprecated' },
        { number_of_members: 21, access_type: 'content 10', statusSlug: 'closed-deprecated' },
        { number_of_members: 43, access_type: 'content 9a', statusSlug: 'closed-deprecated' },
        { number_of_members: 31, access_type: 'content 15', statusSlug: 'closed-unvalidated' },
        { number_of_members: 13, access_type: 'content 6', statusSlug: 'closed-unvalidated' },
        { number_of_members: 9, access_type: 'content 4', statusSlug: 'closed-unvalidated' },
        { number_of_members: 25, access_type: 'content 12', statusSlug: 'closed-validated' },
        { number_of_members: 19, access_type: 'content 9', statusSlug: 'closed-validated' },
        { number_of_members: 3, access_type: 'content 1', statusSlug: 'closed-validated' },
        { number_of_members: 33, access_type: 'content 0', statusSlug: 'closed-validated' },
        { number_of_members: 41, access_type: 'content 20', statusSlug: 'open' },
        { number_of_members: 37, access_type: 'content 18', statusSlug: 'open' },
        { number_of_members: 35, access_type: 'content 17', statusSlug: 'open' },
        { number_of_members: 27, access_type: 'content 13', statusSlug: 'open' },
        { number_of_members: 29, access_type: 'content 11', statusSlug: 'open' },
        { number_of_members: 23, access_type: 'content 11', statusSlug: 'open' },
        { number_of_members: 36, access_type: 'content 9b', statusSlug: 'open' },
        { number_of_members: 17, access_type: 'content 8', statusSlug: 'open' },
        { number_of_members: 15, access_type: 'content 6', statusSlug: 'open' },
        { number_of_members: 11, access_type: 'content 5', statusSlug: 'open' },
        { number_of_members: 7, access_type: 'content 3', statusSlug: 'open' },
        { number_of_members: 5, access_type: 'content 2', statusSlug: 'open' },
        { number_of_members: 1, access_type: 'content 0', statusSlug: 'open' }
      ]

      expect(sortListByMultipleCriteria(spaceList, [SORT_BY.STATUS, SORT_BY.SPACE_TYPE, SORT_BY.NUMBER_OF_MEMBERS], SORT_ORDER.DESCENDING, 'fr'))
        .to.deep.equal(spaceListSorted)
    })
  })

  describe('Function sortListBy()', () => {
    it('should naturally sort the array if the param are PUBLIC_NAME', () => {
      const userList = [
        { user_id: 1, publicName: 'publicName 0' },
        { user_id: 3, publicName: 'publicName 1' },
        { user_id: 21, publicName: 'publicName 10' },
        { user_id: 23, publicName: 'publicName 11' },
        { user_id: 25, publicName: 'publicName 12' },
        { user_id: 27, publicName: 'publicName 13' },
        { user_id: 29, publicName: 'publicName 14' },
        { user_id: 31, publicName: 'publicName 15' },
        { user_id: 33, publicName: 'publicName 16' },
        { user_id: 35, publicName: 'publicName 17' },
        { user_id: 37, publicName: 'publicName 18' },
        { user_id: 39, publicName: 'publicName 19' },
        { user_id: 5, publicName: 'publicName 2' },
        { user_id: 41, publicName: 'publicName 20' },
        { user_id: 7, publicName: 'publicName 3' },
        { user_id: 9, publicName: 'publicName 4' },
        { user_id: 11, publicName: 'publicName 5' },
        { user_id: 13, publicName: 'publicName 6' },
        { user_id: 15, publicName: 'publicName 7' },
        { user_id: 17, publicName: 'publicName 8' },
        { user_id: 19, publicName: 'publicName 9' },
        { user_id: 36, publicName: 'publicName 9b' },
        { user_id: 43, publicName: 'publicName 9a' }
      ]

      const userListSorted = [
        { user_id: 1, publicName: 'publicName 0' },
        { user_id: 3, publicName: 'publicName 1' },
        { user_id: 5, publicName: 'publicName 2' },
        { user_id: 7, publicName: 'publicName 3' },
        { user_id: 9, publicName: 'publicName 4' },
        { user_id: 11, publicName: 'publicName 5' },
        { user_id: 13, publicName: 'publicName 6' },
        { user_id: 15, publicName: 'publicName 7' },
        { user_id: 17, publicName: 'publicName 8' },
        { user_id: 19, publicName: 'publicName 9' },
        { user_id: 43, publicName: 'publicName 9a' },
        { user_id: 36, publicName: 'publicName 9b' },
        { user_id: 21, publicName: 'publicName 10' },
        { user_id: 23, publicName: 'publicName 11' },
        { user_id: 25, publicName: 'publicName 12' },
        { user_id: 27, publicName: 'publicName 13' },
        { user_id: 29, publicName: 'publicName 14' },
        { user_id: 31, publicName: 'publicName 15' },
        { user_id: 33, publicName: 'publicName 16' },
        { user_id: 35, publicName: 'publicName 17' },
        { user_id: 37, publicName: 'publicName 18' },
        { user_id: 39, publicName: 'publicName 19' },
        { user_id: 41, publicName: 'publicName 20' }
      ]

      expect(sortListBy(userList, SORT_BY.PUBLIC_NAME, SORT_ORDER.ASCENDING, 'pt')).to.deep.equal(userListSorted)
    })

    it('should sort DESCENDING the array if it is a param', () => {
      const spaceList = [
        { contentId: 1, created_raw: '2022-11-06T16:10:24Z' },
        { contentId: 3, created: '2022-11-22T16:10:24Z' },
        { contentId: 21, created_raw: '2022-11-22T16:15:24Z' },
        { contentId: 23, created: '2022-06-22T16:10:24Z' },
        { contentId: 25, created_raw: '2022-11-22T16:10:24Z' },
        { contentId: 27, created: '2002-11-22T06:10:24Z' },
        { contentId: 29, created_raw: '2002-11-22T06:10:24Z' }
      ]

      const spaceListSorted = [
        { contentId: 29, created_raw: '2002-11-22T06:10:24Z' },
        { contentId: 27, created: '2002-11-22T06:10:24Z' },
        { contentId: 23, created: '2022-06-22T16:10:24Z' },
        { contentId: 1, created_raw: '2022-11-06T16:10:24Z' },
        { contentId: 25, created_raw: '2022-11-22T16:10:24Z' },
        { contentId: 3, created: '2022-11-22T16:10:24Z' },
        { contentId: 21, created_raw: '2022-11-22T16:15:24Z' }
      ]

      expect(sortListBy(spaceList, SORT_BY.CREATION_DATE, SORT_ORDER.DESCENDING)).to.deep.equal(spaceListSorted)
    })
  })

  describe('Function putFoldersAtListBeginning()', () => {
    it('should put the folders in the benning of the array', () => {
      const spaceList = [
        { modified: 1, type: CONTENT_TYPE.COMMENT },
        { modified: 3, type: CONTENT_TYPE.FILE },
        { modified: 21, type: CONTENT_TYPE.FOLDER },
        { modified: 23, type: CONTENT_TYPE.HTML_DOCUMENT },
        { modified: 25, type: CONTENT_TYPE.KANBAN },
        { modified: 27, type: CONTENT_TYPE.FOLDER },
        { modified: 29, type: CONTENT_TYPE.THREAD }
      ]

      const spaceListSorted = [
        { modified: 21, type: CONTENT_TYPE.FOLDER },
        { modified: 27, type: CONTENT_TYPE.FOLDER },
        { modified: 1, type: CONTENT_TYPE.COMMENT },
        { modified: 3, type: CONTENT_TYPE.FILE },
        { modified: 23, type: CONTENT_TYPE.HTML_DOCUMENT },
        { modified: 25, type: CONTENT_TYPE.KANBAN },
        { modified: 29, type: CONTENT_TYPE.THREAD }
      ]

      expect(putFoldersAtListBeginning(spaceList)).to.deep.equal(spaceListSorted)
    })
  })

  describe('Function sortTimelineByDate()', () => {
    it('should sort the timeline array for creation date', () => {
      const timelineData = [
        { created_raw: 1 },
        { created_raw: 3 },
        { created_raw: 21 },
        { created_raw: 23 },
        { created_raw: 35 },
        { created_raw: 5 },
        { created_raw: 41 },
        { created_raw: 7 },
        { created_raw: 19 },
        { created_raw: 36 },
        { created_raw: 43 }
      ]

      const sortedTimelineData = [
        { created_raw: 1 },
        { created_raw: 3 },
        { created_raw: 5 },
        { created_raw: 7 },
        { created_raw: 19 },
        { created_raw: 21 },
        { created_raw: 23 },
        { created_raw: 35 },
        { created_raw: 36 },
        { created_raw: 41 },
        { created_raw: 43 }
      ]

      expect(sortTimelineByDate(timelineData)).to.deep.equal(sortedTimelineData)
    })

    describe('if two elements has same creation date', () => {
      it('should sort two revision by revision_id', () => {
        const timelineData = [
          { created_raw: 1 },
          { created_raw: 3 },
          { created_raw: 21 },
          { created_raw: 23 },
          { created_raw: 43, revision_id: 5 },
          { created_raw: 5 },
          { created_raw: 41 },
          { created_raw: 7 },
          { created_raw: 19 },
          { created_raw: 36 },
          { created_raw: 43, revision_id: 1 }
        ]

        const sortedTimelineData = [
          { created_raw: 1 },
          { created_raw: 3 },
          { created_raw: 5 },
          { created_raw: 7 },
          { created_raw: 19 },
          { created_raw: 21 },
          { created_raw: 23 },
          { created_raw: 36 },
          { created_raw: 41 },
          { created_raw: 43, revision_id: 1 },
          { created_raw: 43, revision_id: 5 }
        ]

        expect(sortTimelineByDate(timelineData)).to.deep.equal(sortedTimelineData)
      })

      it('should sort two comments by content_id', () => {
        const timelineData = [
          { created_raw: 1 },
          { created_raw: 3 },
          { created_raw: 21 },
          { created_raw: 23 },
          { created_raw: 43, content_id: 8 },
          { created_raw: 5 },
          { created_raw: 41 },
          { created_raw: 7 },
          { created_raw: 19 },
          { created_raw: 36 },
          { created_raw: 43, content_id: 9 }
        ]

        const sortedTimelineData = [
          { created_raw: 1 },
          { created_raw: 3 },
          { created_raw: 5 },
          { created_raw: 7 },
          { created_raw: 19 },
          { created_raw: 21 },
          { created_raw: 23 },
          { created_raw: 36 },
          { created_raw: 41 },
          { created_raw: 43, content_id: 8 },
          { created_raw: 43, content_id: 9 }
        ]

        expect(sortTimelineByDate(timelineData)).to.deep.equal(sortedTimelineData)
      })

      it('should choose the revision first between a revision and a comment', () => {
        const timelineData = [
          { created_raw: 1 },
          { created_raw: 3 },
          { created_raw: 21 },
          { created_raw: 23 },
          { created_raw: 43, revision_id: 95, content_id: 63 },
          { created_raw: 5 },
          { created_raw: 41 },
          { created_raw: 7 },
          { created_raw: 19 },
          { created_raw: 36 },
          { created_raw: 43, content_id: 4 }
        ]

        const sortedTimelineData = [
          { created_raw: 1 },
          { created_raw: 3 },
          { created_raw: 5 },
          { created_raw: 7 },
          { created_raw: 19 },
          { created_raw: 21 },
          { created_raw: 23 },
          { created_raw: 36 },
          { created_raw: 41 },
          { created_raw: 43, revision_id: 95, content_id: 63 },
          { created_raw: 43, content_id: 4 }
        ]

        expect(sortTimelineByDate(timelineData)).to.deep.equal(sortedTimelineData)
      })
    })
  })
})
