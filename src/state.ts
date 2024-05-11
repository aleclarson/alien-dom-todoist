import { ArrayRef, arrayRef, observe, refs } from 'alien-dom'
import { uid } from 'uid'
import { isArray } from '@alloc/is'

export enum TodoStatus {
  Inactive,
  Active,
  Completed,
}

export interface Todo {
  id: string
  status: TodoStatus
  text: string
}

export const todoList = arrayRef<Todo>()

// This contains the todos that were completed before
// the page was loaded (i.e. in a previous session).
export const completedTodos = arrayRef<Todo>()

export function createTodo(init: {
  id?: string
  text: string
  status?: TodoStatus
  before?: Todo
}): Todo {
  let todo: Todo = {
    id: init.id ?? uid(),
    status: init.status ?? TodoStatus.Inactive,
    text: init.text,
  }

  // Clone the todo as an observable object.
  todo = refs(todo, () => {
    // Save the todo list when a todo is changed.
    saveTodoList(todoList)
  })

  // Allow inserting a todo before another.
  if (init.before) {
    const beforeIndex = todoList.indexOf(init.before)
    if (beforeIndex !== -1) {
      todoList.splice(beforeIndex, 0, todo)
      return todo
    }
  }

  if (init.status == TodoStatus.Completed) {
    completedTodos.push(todo)
  } else {
    todoList.push(todo)
  }

  return todo
}

export function removeTodo(todo: Todo) {
  // Left as an exercise to the reader.
}

export function saveTodoList(todoList: readonly Todo[] | ArrayRef<Todo>) {
  if (!isArray(todoList)) {
    todoList = todoList.value as Todo[]
  }
  localStorage.setItem('todoList', JSON.stringify(todoList))
}

// Load the saved todo list.
const savedTodoList = JSON.parse(localStorage.getItem('todoList') || '[]')
savedTodoList.forEach(createTodo)

// Watch for changes to the todo list.
observe(todoList, saveTodoList)
