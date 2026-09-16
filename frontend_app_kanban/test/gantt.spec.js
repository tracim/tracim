import assert from 'node:assert'

import {
  applyBusinessRulesToProjects,
  colors,
  convertTasksListToGantt,
  getAllDependencies,
  getColorsForTask,
  getTasksByIdentifier,
  getTasksListFromKanbanCards,
  prepareDates,
  sortTasksByDependencies
} from '../src/gantt.ts'

describe('gantt.ts', () => {
  const board = [
    {
      id: 'c1',
      title: 'foo',
      bgColor: '',
      cards: [
        {
          id: 't1',
          title: 'foo-t1',
          bgColor: 'green',
          finished: false,
          assignmentLists: [],
          depends: []
        },
        {
          id: 't2',
          title: 'foo-t2',
          bgColor: '',
          finished: false,
          assignmentLists: [1],
          depends: ['t1']
        }
      ]
    }
  ]

  const projects = [
    {
      id: 'c1',
      name: 'foo',
      tasks: [
        {
          id: 't1',
          name: 'foo-t1',
          duration: 1,
          progress: 0,
          finished: true,
          start: new Date(2026, 9, 15),
          end: new Date(2026, 9, 15),
          depends: [],
          _card: {
            id: 't1',
            title: 'foo-t1',
            finished: true,
            assignmentLists: [],
            depends: []
          }
        },
        {
          id: 't2',
          name: 'foo-t2',
          duration: 2,
          progress: 42,
          finished: false,
          start: new Date(2026, 9, 15),
          end: new Date(2026, 9, 16),
          depends: ['t1'],
          _card: {
            id: 't2',
            title: 'foo-t2',
            finished: false,
            duration: 2,
            progress: 42,
            assignmentLists: [],
            depends: ['t1']
          }
        },
        {
          id: 't3',
          name: 'foo-t3',
          duration: 1,
          progress: 0,
          finished: false,
          start: new Date(2026, 9, 15),
          end: new Date(2026, 9, 15),
          depends: ['t2'],
          _card: {
            id: 't3',
            title: 'foo-t3',
            finished: false,
            assignmentLists: [],
            depends: ['t2']
          }
        }
      ]
    }
  ]

  const recursiveProjects = [
    {
      id: 'r1',
      name: 'recursive',
      tasks: [
        {
          id: 't1',
          name: 'foo-t1',
          duration: 1,
          progress: 0,
          finished: false,
          start: new Date(2026, 9, 15),
          end: new Date(2026, 9, 15),
          depends: ['t2'],
          _card: {
            id: 't1',
            title: 'foo-t1',
            finished: false,
            assignmentLists: [],
            depends: ['t2']
          }
        },
        {
          id: 't2',
          name: 'foo-t2',
          duration: 2,
          progress: 42,
          finished: false,
          start: new Date(2026, 9, 15),
          end: new Date(2026, 9, 15),
          depends: ['t1'],
          _card: {
            id: 't2',
            title: 'foo-t2',
            finished: false,
            assignmentLists: [],
            depends: ['t1']
          }
        }
      ]
    }
  ]

  const unsortedBoard = [
    {
      id: 'project-1',
      title: 'Project 1',
      bgColor: '',
      cards: [
        {
          id: 'task-1',
          title: 'Task 123',
          kickoff: '2026-09-07',
          duration: '3',
          assignmentLists: [],
          depends: []
        },
        {
          id: 'task-2',
          title: 'Task 140',
          duration: '2',
          finished: true,
          depends: ['task-1']
        },
        {
          id: 'task-3',
          title: 'Task 138',
          duration: '5',
          finished: true,
          depends: ['task-1']
        },
        {
          id: 'task-4',
          title: 'Task 27',
          duration: '8',
          depends: ['task-1', 'task-2', 'task-5']
        },
        {
          id: 'task-5',
          name: 'Task 141',
          duration: '2',
          finished: true,
          depends: ['task-2']
        }
      ]
    }
  ]

  it('apply business rules to projects', () => {
    const unsortedProjects = getTasksListFromKanbanCards(unsortedBoard)
    const sortedProjects = applyBusinessRulesToProjects(unsortedProjects)
    assert.deepEqual(
      sortedProjects.flatMap((project) => project.tasks.map((task) => task.id)),
      ['task-1', 'task-2', 'task-3', 'task-5', 'task-4']
    )
    assert.deepEqual(
      sortedProjects.flatMap((project) => project.tasks.map((task) => task.start.toDateString())),
      [
        'Mon Sep 07 2026',
        'Thu Sep 10 2026',
        'Thu Sep 10 2026',
        'Mon Sep 14 2026',
        'Wed Sep 16 2026'
      ]
    )
    assert.deepEqual(
      sortedProjects.flatMap((project) => project.tasks.map((task) => task.end.toDateString())),
      [
        'Wed Sep 09 2026',
        'Fri Sep 11 2026',
        'Wed Sep 16 2026',
        'Tue Sep 15 2026',
        'Fri Sep 25 2026'
      ]
    )
  })

  it('convert the list of tasks to Frappe-Gantt format', () => {
    const gantt = convertTasksListToGantt(projects)
    assert.equal(gantt.length, 4)
    assert.equal(gantt[0].name, 'foo')
    assert.equal(gantt[0].color, undefined)
    assert.equal(gantt[0].custom_class, 'gantt-section')
    assert.equal(gantt[1].name, 'foo-t1')
    assert.equal(gantt[1].color, colors.FINISHED_TASK)
    assert.equal(gantt[1].duration, '1d')
  })

  it('get tasks from kanban board', () => {
    const tasks = getTasksListFromKanbanCards(board)
    assert.equal(tasks.length, 1)
    assert.equal(tasks[0].name, 'foo')
    assert.equal(tasks[0].tasks.length, 2)
    assert.equal(tasks[0].tasks[0].name, 'foo-t1')
    assert.equal(tasks[0].tasks[0]._card, board[0].cards[0])
    assert.equal(tasks[0].tasks[1].depends[0], 't1')
    assert.equal(tasks[0].tasks[1]._card, board[0].cards[1])
  })

  describe('get all dependencies', () => {
    it('without recursive dependencies', () => {
      const dependencies = getAllDependencies(projects)
      assert.deepEqual(dependencies, { t1: ['t2'], t2: ['t3'] })
    })

    it('with recursive dependencies', () => {
      const dependencies = getAllDependencies(recursiveProjects)
      assert.deepEqual(dependencies, { t1: ['t2'], t2: ['t1'] })
    })
  })

  describe('get colors for task', () => {
    const tests = [
      {
        message: 'finished task',
        args: { finished: true, progress: 0 },
        expected: [colors.FINISHED_TASK, colors.FINISHED_TASK]
      },
      {
        message: 'not finished task but with 100% progression',
        args: { finished: false, progress: 100 },
        expected: [colors.FINISHED_TASK, colors.FINISHED_TASK]
      },
      {
        message: 'not finished task with ending today',
        args: { finished: false, progress: 42, end: new Date(Date.now()) },
        expected: ['', '']
      },
      {
        message: 'not finished task with ending in the past',
        args: { finished: false, progress: 0, end: new Date(2026, 1, 1) },
        expected: [colors.OVERDUE_TASK, colors.OVERDUE_TASK_OVERLAY]
      }
    ]

    tests.forEach(({ message, args, expected }) => {
      it(message, () => {
        assert.deepEqual(getColorsForTask(args), expected)
      })
    })
  })

  it('get tasks by identifier', () => {
    const identifiers = getTasksByIdentifier(projects)
    assert.deepEqual(Object.keys(identifiers), ['t1', 't2', 't3'])
    assert.equal(identifiers.t2, projects[0].tasks[1])
  })

  describe('prepare date', () => {
    it('with dates', () => {
      const [start, end] = prepareDates({ kickoff: '2026-09-15', deadline: '2026-09-17' }, 1, false)
      assert.equal(start.toDateString(), 'Tue Sep 15 2026')
      assert.equal(end.toDateString(), 'Thu Sep 17 2026')
    })

    describe('without deadline', () => {
      const tests = [
        {
          args: [{ kickoff: '2026-09-15', deadline: undefined }, 2, false],
          expected: ['Tue Sep 15 2026', 'Wed Sep 16 2026']
        },
        {
          args: [{ kickoff: '2026-09-15', deadline: undefined }, 5, false],
          expected: ['Tue Sep 15 2026', 'Sat Sep 19 2026']
        },
        {
          args: [{ kickoff: '2026-09-15', deadline: undefined }, 5, true],
          expected: ['Tue Sep 15 2026', 'Mon Sep 21 2026']
        }
      ]

      tests.forEach(({ args, expected }) => {
        const [card, duration, weekend] = args
        it(`kickoff ${card.kickoff} with duration ${duration} days and exclude weekend as ${weekend}`, () => {
          const [start, end] = prepareDates(card, duration, weekend)
          assert.equal(start.toDateString(), expected[0])
          assert.equal(end.toDateString(), expected[1])
        })
      })
    })

    describe('without kickoff', () => {
      const tests = [
        {
          args: [{ kickoff: undefined, deadline: '2026-09-15' }, 2, false],
          expected: ['Mon Sep 14 2026', 'Tue Sep 15 2026']
        },
        {
          args: [{ kickoff: undefined, deadline: '2026-09-15' }, 5, false],
          expected: ['Fri Sep 11 2026', 'Tue Sep 15 2026']
        },
        {
          args: [{ kickoff: undefined, deadline: '2026-09-15' }, 5, true],
          expected: ['Wed Sep 09 2026', 'Tue Sep 15 2026']
        }
      ]

      tests.forEach(({ args, expected }) => {
        const [card, duration, weekend] = args
        it(`deadline ${card.deadline} with duration ${duration} days and exclude weekend as ${weekend}`, () => {
          const [start, end] = prepareDates(card, duration, weekend)
          assert.equal(start.toDateString(), expected[0])
          assert.equal(end.toDateString(), expected[1])
        })
      })
    })

    it('without dates', () => {
      const [start, end] = prepareDates({ kickoff: undefined, deadline: undefined }, 1, false)
      const today = new Date(Date.now())
      assert.equal(start.toDateString(), today.toDateString())
      assert.equal(end.toDateString(), today.toDateString())
    })
  })

  describe('sort tasks by dependencies', () => {
    it('no need to sorted', () => {
      const tasks = sortTasksByDependencies(projects[0].tasks)
      assert.equal(tasks[0].id, 't1')
      assert.equal(tasks[1].id, 't2')
      assert.equal(tasks[2].id, 't3')
    })

    it('need to be sorted', () => {
      const tasks = sortTasksByDependencies(projects[0].tasks.reverse())
      assert.equal(tasks[0].id, 't1')
      assert.equal(tasks[1].id, 't2')
      assert.equal(tasks[2].id, 't3')
    })

    it('recursive case', () => {
      const tasks = sortTasksByDependencies(recursiveProjects[0].tasks)
      assert.equal(tasks[0].id, 't1')
      assert.equal(tasks[1].id, 't2')
    })
  })
})
