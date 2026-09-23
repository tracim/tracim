import {
  addBusinessDays,
  addDays,
  isPast,
  isToday,
  subBusinessDays,
  subDays
} from 'date-fns'

import { recursiveDependencies } from './helper.js'

interface Dependencies {
  [id: string]: string
}
interface IdentifiedDependency {
  id: string
  task: Task
  parent: string | null
}
interface IdentifiedTasks {
  [id: string]: Task
}
type NodeWithDepends = [
  identifier: string,
  depends: string[]
]

interface GanttBar {
  readonly id: string
  name: string
  color: string
  color_progress: string
  custom_class?: string
  duration: string
  progress: number
  start: Date
  end: Date
  dependencies: string[]
  _card: KanbanCard
}

interface KanbanColumn {
  readonly id: string
  title: string
  bgColor: string
  cards: KanbanCard[]
}

interface KanbanCard {
  readonly id: string
  title: string
  description?: string
  bgColor: string
  kickoff?: string
  deadline?: string
  freeInput?: string
  duration?: string
  progress?: string
  finished: boolean
  assignmentLists: number[]
  depends: string[]
}

interface Project {
  readonly id: string
  name: string
  color?: string
  tasks: Task[]
}

interface Task {
  readonly id: string
  name: string
  duration: number
  progress: number
  finished: boolean
  start: Date
  end: Date
  depends: string[]
  _card: KanbanCard
}

interface Options {
  excludeWeekendDays: boolean
  weekendDays: number[]
}

export const colors = {
  FINISHED_TASK: '#C0DD97',
  OVERDUE_TASK: '#FFF1F1',
  OVERDUE_TASK_OVERLAY: '#F7C1C1'
}

export const defaultOptions: Options = {
  excludeWeekendDays: true,
  weekendDays: [0, 6] // Sunday, Saturday
}

/**
 * INFO - A.L - 2026-09-15 - These two functions are wrapper around the
 * date-fns functions. If we wants to use custom weekend days, these
 * functions must be altered to calc the delta based on these custom days.
 * ---
 * The two projects date-fns and frappe-gantt have the saturday/sunday weekend
 * days hard-coded in their sources:
 * - https://github.com/date-fns/date-fns/blob/main/pkgs/core/src/addBusinessDays/index.ts
 * - https://github.com/frappe/gantt/blob/master/src/index.js#L126
 */
const add = (date: Date, days: number, excludeWeekendDays: boolean): Date => {
  return excludeWeekendDays ? addBusinessDays(date, days) : addDays(date, days)
}
const sub = (date: Date, days: number, excludeWeekendDays: boolean): Date => {
  return excludeWeekendDays ? subBusinessDays(date, days) : subDays(date, days)
}

/**
 * Apply the rules used to represent the tasks in the Gantt view
 */
export const applyBusinessRulesToProjects = (
  projects: Project[],
  { excludeWeekendDays, weekendDays }: Options = defaultOptions
): Project[] => {
  console.debug('%c<Gantt> apply rules on all the projects', 'color: chartreuse')

  const tasksById: IdentifiedTasks = getTasksByIdentifier(projects)
  const dependencies: Dependencies = getAllDependencies(projects)

  // Sort all the tasks by dependencies to manage inter-project relations
  const allTasks: Task[] = projects.flatMap((project: Project) => project.tasks)

  sortTasksByDependencies(allTasks, tasksById, dependencies).forEach((task: Task) => {
    // INFO - A.L - 2026-08-25 - Compute again the cards without kickoff
    // since their dependencies do have computed dates from previous map.
    if (task.depends.length > 0 && !task._card.kickoff) {
      let start = null

      recursiveDependencies(task.depends, dependencies)
        .filter((id) => id !== task.id)
        .forEach((id) => {
          const parentTask = tasksById[id]
          if (parentTask && (!start || parentTask.end >= start)) {
            const parentTaskEnd = parentTask.end
            parentTaskEnd.setHours(0, 0, 0, 0)

            task.start = add(parentTaskEnd, 1, excludeWeekendDays)
            task.end = add(task.start, task.duration - 1, excludeWeekendDays)
            tasksById[task.id] = task

            start = task.start
            console.debug(
              '<GanttRule> apply rule on %s “%s”: set dates from %s “%s”',
              task.id, task.name,
              parentTask.id, parentTask.name,
              parentTask, task
            )
          }
        })
    }
  })

  // Update the list of projects with the new value for each dependencies and
  // sort the whole list of tasks by their starting date.
  projects.forEach((project: Project) => {
    project.tasks = project.tasks
      .map((task: Task) => {
        return tasksById[task.id] ? tasksById[task.id] : task
      })
      .sort((first: Task, second: Task) => {
        if (first.start < second.start) return -1
        if (second.start < first.start) return 1
        return 0
      })
  })

  return projects
}

/**
 * Convert all the projects as a structure usable by Frappe-Gantt
 */
export const convertTasksListToGantt = (projects: Project[]): GanttBar[] => {
  console.debug('%c<Gantt> convert the list of tasks to Gantt', 'color: chartreuse', projects)
  return projects.flatMap((project: Project) => ([
    {
      id: project.id,
      name: project.name,
      start: new Date(Date.now()),
      end: new Date(Date.now()),
      color: project.color,
      custom_class: 'gantt-section'
    },
    ...project.tasks.map((task: Task) => {
      const [color, colorProgress] = getColorsForTask(task)

      // INFO - A.L - 2026-09-15 - Since the card in the Kanban only use
      // date and not datetime, the kickoff will start at midnight and the
      // deadline at 23h59.
      const start = task.start
      start.setHours(0, 0, 0, 0)
      const end = task.end
      end.setHours(23, 59, 59, 0)

      return {
        id: task.id,
        name: task.name,
        color,
        color_progress: colorProgress,
        start,
        end,
        duration: `${task.duration}d`,
        dependencies: task.depends,
        progress: task.finished ? 100 : task.progress,
        _card: task._card
      }
    })
  ]))
}

/**
 * Retrieve all the dependencies available from the list of projects
 *
 * The goal is to have a structure where we can access to the dependencies of
 * a task from the task identifier.
 */
export const getAllDependencies = (projects: Project[]): Dependencies => {
  const dependencies = {}

  projects.forEach((project: Project) =>
    project.tasks.forEach((task: Task) =>
      task.depends.forEach((dependId: string) => {
        if (!dependencies[dependId]) {
          dependencies[dependId] = []
        }
        if (!dependencies[dependId].includes(task.id)) {
          dependencies[dependId].push(task.id)
        }
      })))

  console.debug('%c<Gantt> retrieve all the dependencies from the list of projects', 'color: chartreuse', dependencies)
  return dependencies
}

/**
 * Retrieve the colors based on the status of the specified task
 *
 * @returns {string[]} The background and the progression color values as list
 */
export const getColorsForTask = (task: Task): string[] => {
  if (task.finished || task.progress === 100) {
    return [colors.FINISHED_TASK, colors.FINISHED_TASK]
  } else if (!isToday(task.end) && isPast(task.end)) {
    return [colors.OVERDUE_TASK, colors.OVERDUE_TASK_OVERLAY]
  }
  return ['', '']
}

/**
 * Retrieve all the tasks available from the list of projects
 */
export const getTasksByIdentifier = (projects: Project[]): IdentifiedTasks => {
  const identifiers = {}
  projects.forEach((project: Project) => project.tasks.forEach((task: Task) => {
    identifiers[task.id] = task
  }))
  console.debug('%c<Gantt> retrieve all the tasks from the list of projects', 'color: chartreuse', identifiers)
  return identifiers
}

/**
 * Convert a structure from react-kanban to a list of projects
 */
export const getTasksListFromKanbanCards = (
  kanban: KanbanColumn[],
  { excludeWeekendDays, weekendDays }: Options = defaultOptions
): Project[] => {
  console.debug('%c<Gantt> retrieve the list of cards from the Kanban', 'color: chartreuse', kanban)
  return kanban.map(({ id, title, bgColor, cards }: KanbanColumn) => ({
    id,
    name: title,
    color: bgColor,
    tasks: cards
      .map((card: KanbanCard) => {
        const duration = parseInt(card.duration) || 1
        const [start, end] = prepareDates(card, duration, excludeWeekendDays)

        return {
          id: card.id,
          name: card.title,
          depends: card.depends || [],
          start,
          end,
          duration,
          progress: parseInt(card.progress) || 0,
          finished: card.finished,
          _card: card
        }
      })
  }))
}

/**
 * Prepare the start and end dates
 */
export const prepareDates = (card: KanbanCard, duration: number, excludeWeekendDays: boolean): Date[] => {
  let start = card.kickoff
  let end = card.deadline

  if (start && !end) {
    start = new Date(start)
    end = add(start, duration - 1, excludeWeekendDays)
    console.debug(
      '<GanttRule> apply rule on %s “%s”: set deadline date to %s', card.id, card.title, end.toString()
    )
  } else if (!start && end) {
    end = new Date(end)
    start = sub(end, duration - 1, excludeWeekendDays)
    console.debug(
      '<GanttRule> apply rule on %s “%s”: set kickoff date to %s', card.id, card.title, start.toString()
    )
  } else if (!start && !end) {
    start = new Date(Date.now())
    start.setHours(0, 0, 0, 0)
    end = add(start, duration - 1, excludeWeekendDays)
    console.debug(
      '<GanttRule> apply rule on %s “%s”: set dates as today', card.id, card.title
    )
  } else {
    start = new Date(start)
    end = new Date(end)
  }

  // Avoid ending date value before the starting date value
  if (start > end) {
    end = add(start, duration - 1, excludeWeekendDays)
  }

  return [start, end]
}

/**
 * Retrieve all the dependencies related to the specified task identifier
 */
const getDependenciesFromTask = (
  identifier: string,
  dependencies: Dependencies,
  output: string[] = []
): string[] => {
  dependencies[identifier]?.forEach((dependId: string) => {
    if (!output.includes(dependId)) {
      output.push(dependId)
      output = getDependenciesFromTask(dependId, dependencies, output)
    }
  })
  return output
}

/**
 * Sort the list of tasks by their dependencies
 *
 * ## How the sorting process was implemented
 *
 * There is currently four steps to ensure the tasks are correctly sorted by
 * their dependencies:
 *
 * 1) A first array `tasksDependencies` is generate to have all the tasks from
 *    the specified tasks as a list of JS objects. For example:
 *    `[{id: 'x', task: {…}, parent: null}, {id: 'y', task: {…}, parent: 'x'}]`
 * 2) All the node without parent from the previous array are retrieved and
 *    sorted by their number of dependencies. The identifier of these sorted
 *    tasks will be inserted in the `sortedByIdentifier` array.
 *    The root task with the higher number of dependencies are put at the
 *    beginning of the list, to ensure these tasks are computed sooner.
 * 3) The tasks are inserted in the `sortedByIdentifier` array based on the
 *    parent position in this array. This array will give the final position
 *    of each identifier based on the dependencies.
 * 4) The final array will be returned, by fetching the task information from
 *    the `tasksById` variable. All the unknown task will be ignored during the
 *    process.
 */
export const sortTasksByDependencies = (
  tasks: Task[],
  tasksById: IdentifiedTasks,
  dependencies: Dependencies
): Task[] => {
  console.debug(
    '%c<Gantt> sort the list of tasks by their dependencies', 'color: chartreuse', tasks
  )
  // Step 1: create dependencies array
  const tasksDependencies: IdentifiedDependency[] = []
  tasks.sort((first: Task, second: Task): number => {
    if (first.depends.length === 0 && second.depends.length > 0) return -1
    if (second.depends.length === 0 && first.depends.length > 0) return 1
    if (first.depends.includes(second.id)) return 1
    if (second.depends.includes(first.id)) return -1
    return 0
  }).forEach((task: Task) => {
    if (task.depends.length === 0) {
      tasksDependencies.push({ id: task.id, task, parent: null })
    } else {
      task.depends.forEach((dependencyId: string) => {
        tasksDependencies.push({ id: task.id, task, parent: dependencyId })
      })
    }
  })

  console.debug(
    '<GanttSort> retrieve the sorted list of identifiers from the dependencies', tasksDependencies
  )
  // Step 2: sort the root tasks first
  const sortedByIdentifier: string[] = tasksDependencies
    .filter((depend: IdentifiedDependency) => depend.parent === null)
    .map((depend: IdentifiedDependency) => ([
      depend.id, getDependenciesFromTask(depend.id, dependencies).length
    ]))
    .sort((first, second): NodeWithDepends[] => {
      // Check the number of dependencies related to the node first, to put
      // the highest number at the beginning of the list.
      if (first[1] > second[1]) return -1
      if (first[1] < second[1]) return 1
      return 0
    })
    .map(([identifier, size]): NodeWithDepends => identifier)

  console.debug(
    '<GanttSort> start the sorting process with the root nodes', sortedByIdentifier
  )
  // Step 3: add the sorted children next to their parents
  tasksDependencies
    .forEach((depend: IdentifiedDependency) => {
      if (depend.parent !== null) {
        const dependIndex = sortedByIdentifier.indexOf(depend.id)
        const parentIndex = sortedByIdentifier.indexOf(depend.parent)

        if (dependIndex > -1) {
          sortedByIdentifier.splice(dependIndex, 1)
        }

        if (parentIndex === -1) {
          sortedByIdentifier.splice(sortedByIdentifier.length, 0, depend.parent)
          sortedByIdentifier.splice(sortedByIdentifier.length, 0, depend.id)
        } else {
          sortedByIdentifier.splice(parentIndex + 1, 0, depend.id)
        }
      }
    })

  console.debug(
    '<GanttSort> retrieve information from the sorted list of identifiers', sortedByIdentifier
  )
  // Step 4: return the list of ordered tasks and exclude unknown one
  return sortedByIdentifier
    .map((id: string) => tasksById[id])
    .filter((task: Task | undefined) => task !== undefined)
}
