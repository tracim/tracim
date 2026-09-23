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

  const complexeBoard = [
    {
      id: 'project-1',
      title: 'Project 1',
      bgColor: '',
      cards: [
        {
          id: 'task-11',
          title: 'Task 11',
          duration: '1',
          depends: ['task-22']
        },
        {
          id: 'task-12',
          title: 'Task 12',
          kickoff: '2026-09-01',
          duration: '4',
          depends: []
        },
        {
          id: 'task-13',
          title: 'Task 13',
          duration: '2',
          depends: ['task-11']
        },
        {
          id: 'task-14',
          title: 'Task 14',
          duration: '4',
          depends: ['task-12', 'task-13']
        }
      ]
    },
    {
      id: 'project-2',
      title: 'Project 2',
      bgColor: '',
      cards: [
        {
          id: 'task-21',
          title: 'Task 21',
          kickoff: '2026-09-01',
          duration: '1',
          depends: []
        },
        {
          id: 'task-22',
          title: 'Task 22',
          duration: '1',
          depends: ['task-21']
        },
        {
          id: 'task-23',
          title: 'Task 23',
          duration: '1',
          depends: ['task-22']
        }
      ]
    }
  ]

  describe('apply business rules to projects', () => {
    it('simple case', () => {
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

    it('complexe case', () => {
      const unsortedProjects = getTasksListFromKanbanCards(complexeBoard)
      const sortedProjects = applyBusinessRulesToProjects(unsortedProjects)
      assert.deepEqual(
        sortedProjects.flatMap((project) => project.tasks.map((task) => task.id)),
        ['task-12', 'task-11', 'task-13', 'task-14', 'task-21', 'task-22', 'task-23']
      )
      assert.deepEqual(
        sortedProjects.flatMap((project) => project.tasks.map((task) => task.start.toDateString())),
        [
          'Tue Sep 01 2026',
          'Thu Sep 03 2026',
          'Fri Sep 04 2026',
          'Tue Sep 08 2026',
          'Tue Sep 01 2026',
          'Wed Sep 02 2026',
          'Thu Sep 03 2026'
        ]
      )
      assert.deepEqual(
        sortedProjects.flatMap((project) => project.tasks.map((task) => task.end.toDateString())),
        [
          'Fri Sep 04 2026',
          'Thu Sep 03 2026',
          'Mon Sep 07 2026',
          'Fri Sep 11 2026',
          'Tue Sep 01 2026',
          'Wed Sep 02 2026',
          'Thu Sep 03 2026'
        ]
      )
    })
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
    describe('with dates', () => {
      const tests = [
        {
          args: [{ kickoff: '2026-09-15', deadline: '2026-09-17' }, 1, false],
          expected: ['Tue Sep 15 2026', 'Thu Sep 17 2026']
        },
        {
          args: [{ kickoff: '2026-09-18', deadline: '2026-09-13' }, 2, false],
          expected: ['Fri Sep 18 2026', 'Sat Sep 19 2026']
        },
        {
          args: [{ kickoff: '2026-09-18', deadline: '2026-09-13' }, 2, true],
          expected: ['Fri Sep 18 2026', 'Mon Sep 21 2026']
        }
      ]

      tests.forEach(({ args, expected }) => {
        const [card, duration, weekend] = args
        it(`kickoff ${card.kickoff} and deadline ${card.deadline} with duration ${duration} days and exclude weekend as ${weekend}`, () => {
          const [start, end] = prepareDates(card, duration, weekend)
          assert.equal(start.toDateString(), expected[0])
          assert.equal(end.toDateString(), expected[1])
        })
      })
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
    const tasksById = Object.fromEntries(projects[0].tasks.map((task) => [task.id, task]))
    const dependencies = { t2: ['t1'], t3: ['t2'] }

    it('no need to sorted', () => {
      const tasks = sortTasksByDependencies(projects[0].tasks, tasksById, dependencies)
      assert.deepEqual(tasks.map((task) => task.id), ['t1', 't2', 't3'])
    })

    it('need to be sorted', () => {
      const tasks = sortTasksByDependencies(projects[0].tasks.reverse(), tasksById, dependencies)
      assert.deepEqual(tasks.map((task) => task.id), ['t1', 't2', 't3'])
    })

    it('recursive case', () => {
      const tasks = sortTasksByDependencies(recursiveProjects[0].tasks, tasksById, dependencies)
      assert.deepEqual(tasks.map((task) => task.id), ['t1', 't2'])
    })
  })

  // INFO - A.L - 2026-09-23 - This Kanban have three root tasks: t1, t5 and t9.
  // The issue #6971 occurs because these tasks were not ordered and the tasks
  // from the last project (MARKETING) were not set before the others. This test
  // will reproduce this problem, to ensure the function did not regress.
  it('sorting case from issue #6971 where the root tasks must be ordered', () => {
    const kanban = {
      columns: [
        {
          title: 'DEV',
          id: 'c1',
          cards: [
            {
              id: 't1',
              title: 'poc',
              assignmentList: [],
              duration: '10',
              depends: [],
              finished: false
            },
            {
              id: 't2',
              title: 'user tests',
              assignmentList: [],
              duration: '5',
              depends: ['t1'],
              finished: false
            },
            {
              id: 't3',
              title: 'fix from user tests',
              assignmentList: [],
              duration: '5',
              depends: ['t2'],
              finished: false
            },
            {
              id: 't4',
              title: 'final tests',
              assignmentList: [],
              duration: '3',
              depends: ['t3'],
              finished: false
            }
          ]
        },
        {
          title: 'IT',
          id: 'c2',
          cards: [
            {
              id: 't5',
              title: 'prepare infra',
              assignmentList: [],
              duration: '2',
              depends: [],
              finished: false
            },
            {
              id: 't6',
              title: 'deploy prod',
              assignmentList: [],
              duration: '2',
              depends: ['t5', 't4'],
              finished: false
            },
            {
              id: 't7',
              title: 'improve infra',
              assignmentList: [],
              duration: '5',
              depends: ['t6'],
              finished: false
            }
          ]
        },
        {
          title: 'MARKETING',
          id: 'c3',
          cards: [
            {
              id: 't8',
              title: 'launch product',
              assignmentList: [],
              depends: ['t6', 't11'],
              finished: false
            },
            {
              id: 't9',
              title: 'landing page',
              assignmentList: [],
              duration: '1',
              depends: [],
              finished: false
            },
            {
              id: 't10',
              title: 'prepare website - part 1',
              assignmentList: [],
              duration: '5',
              depends: ['t9'],
              finished: false
            },
            {
              id: 't11',
              title: 'deploy website',
              assignmentList: [],
              depends: ['t12', 't10'],
              finished: false
            },
            {
              id: 't12',
              title: 'prepare website - part 2',
              assignmentList: [],
              duration: '4',
              depends: ['t10', 't2'],
              finished: false
            }
          ]
        }
      ]
    }

    let projects = getTasksListFromKanbanCards(kanban.columns)
    projects = applyBusinessRulesToProjects(projects)

    const tests = [
      [0, ['t1', 't2', 't3', 't4']],
      [1, ['t5', 't6', 't7']],
      [2, ['t9', 't10', 't12', 't11', 't8']]
    ]
    tests.forEach(([index, expected]) => {
      it(`check ${projects[index].name}`, () => {
        assert.equal(projects[index].tasks.map((task) => task.id), expected)
      })
    })
  })
})
