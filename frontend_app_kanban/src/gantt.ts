import {
  addBusinessDays,
  addDays,
  isPast,
  isToday,
  subBusinessDays,
  subDays
} from 'date-fns'

import { flatten, nested, recursiveDependencies } from './helper.js'

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

/* INFO - A.L - 2026-09-15 - These two functions are wrapper around the
   date-fns functions. If we wants to use custom weekend days, these
   functions must be altered to calc the delta based on these custom days. */
const add = (date: Date, days: number, excludeWeekendDays: boolean): Date => {
  return excludeWeekendDays ? addBusinessDays(date, days) : addDays(date, days)
}
const sub = (date: Date, days: number, excludeWeekendDays: boolean): Date => {
  return excludeWeekendDays ? subBusinessDays(date, days) : subDays(date, days)
}

/* Apply the rules used to represent the tasks in the Gantt view */
export const applyBusinessRulesToProjects = (
  projects: Project[],
  { excludeWeekendDays, weekendDays }: Options = defaultOptions
): Project[] => {
  console.debug('%c<Gantt> apply rules on all the projects', 'color: chartreuse')

  const tasksById: IdentifiedTasks = getTasksByIdentifier(projects)
  const dependencies: Dependencies = getAllDependencies(projects)

  // Sort all the tasks by dependencies to manage inter-project relations
  const allTasks: Task[] = projects.flatMap((project: Project) => project.tasks)

  sortTasksByDependencies(allTasks).forEach((task: Task) => {
    // INFO - A.L - 2026-08-25 - Compute again the cards without kickoff
    // since their dependencies do have computed dates from previous map.
    if (task.depends.length > 0 && !task._card.start) {
      let start = null

      recursiveDependencies(task.depends, dependencies)
        .filter((id) => id !== task.id)
        .forEach((id) => {
          const parentTask = tasksById[id]
          if (parentTask && (!start || parentTask.end > start)) {
            const parentTaskEnd = parentTask.end
            parentTaskEnd.setHours(0, 0, 0)

            // Move the task just after the found parent
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

/* Convert all the projects as a structure usable by Frappe-Gantt */
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
      start.setHours(0, 0, 0)
      const end = task.end
      end.setHours(23, 59, 59)

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

/* Retrieve all the dependencies available from the list of projects */
export const getAllDependencies = (projects: Project[]): Dependencies => {
  console.debug('%c<Gantt> retrieve all the dependencies from the list of projects', 'color: chartreuse', projects)
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

  return dependencies
}

/* Retrieve the colors based on the status of the specified task */
export const getColorsForTask = (task: Task): string[] => {
  if (task.finished || task.progress === 100) {
    return [colors.FINISHED_TASK, colors.FINISHED_TASK]
  } else if (!isToday(task.end) && isPast(task.end)) {
    return [colors.OVERDUE_TASK, colors.OVERDUE_TASK_OVERLAY]
  }
  return ['', '']
}

/* Retrieve all the tasks available from the list of projects */
export const getTasksByIdentifier = (projects: Project[]): IdentifiedTasks => {
  console.debug('%c<Gantt> retrieve all the tasks from the list of projects', 'color: chartreuse', projects)
  const identifiers = {}
  projects.forEach((project: Project) => project.tasks.forEach((task: Task) => {
    identifiers[task.id] = task
  }))
  return identifiers
}

/* Convert a structure from react-kanban to a list of projects */
export const getTasksListFromKanbanCards = (
  kanban: KanbanColumn[],
  { excludeWeekendDays, weekendDays }: Options = defaultOptions
): Project[] => {
  console.debug('%c<Gantt> retrieve the list of cards from the Kanban', 'color: chartreuse', kanban)
  return kanban.map(({ id, title, bgColor, cards }: KanbanColumn) => ({
    id,
    name: title,
    color: bgColor,
    tasks: sortTasksByDependencies(
      cards.map((card: KanbanCard) => {
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
    )
  }))
}

/* Prepare the start and end dates */
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
    start.setHours(0, 0, 0)
    end = add(start, duration - 1, excludeWeekendDays)
    console.debug(
      '<GanttRule> apply rule on %s “%s”: set dates as today', card.id, card.title
    )
  } else {
    start = new Date(start)
    end = new Date(end)
  }

  return [start, end]
}

/* Sort the list of tasks by their dependencies */
export const sortTasksByDependencies = (tasks: Task[]): Task[] => {
  console.debug(
    '%c<Gantt> sort the list of tasks by their dependencies', 'color: chartreuse', tasks
  )
  const tasksDependencies: IdentifiedDependency[] = []
  tasks.sort((first: Task, second: Task): number => {
    if (first.depends.length === 0 && second.depends.length > 0) return -1
    if (second.depends.length === 0 && first.depends.length > 0) return 1
    if (first.depends.includes(second.id)) return 1
    if (second.depends.includes(first.id)) return -1
    return 0
  }).forEach((task: Task) => {
    tasksDependencies.push({ id: task.id, task, parent: null })
    task.depends.forEach((dependencyId: string) => {
      tasksDependencies.push({ id: task.id, task, parent: dependencyId })
    })
  })

  const tasksById: IdentifiedTasks = {}
  const sortedTasks: Task[] = []
  flatten(nested(tasksDependencies), 'task').forEach((task: Task) => {
    if (!tasksById[task.id]) {
      sortedTasks.push(task)
      tasksById[task.id] = task
    }
  })

  return sortedTasks
}
