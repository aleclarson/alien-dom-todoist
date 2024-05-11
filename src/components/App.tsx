import {
  useEffect,
  useRef,
  AlienEvent,
  EffectContext,
  HTML,
  JSX,
  animate,
  useComputed,
  patchStyle,
  useRefs,
} from 'alien-dom'
import { Todo, TodoStatus, createTodo, todoList } from '@/state'
import { Icon } from '@/Icon'
import { ActionButton } from '@/ActionButton'
import { useEventState } from '@/useEventState'
import { uid } from 'uid'

export function App() {
  return (
    <div>
      <h1 class="text-26">My Todos</h1>
      <div>
        {todoList.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </div>
      <TodoCreator />
    </div>
  )
}

function TodoItem({ todo }: { todo: Todo }) {
  const todoCompletedRef = useComputed(
    () => todo.status == TodoStatus.Completed
  )

  function CompleteButton(props: JSX.HTMLProps<'div'>) {
    const [hovered] = useEventState('hover')

    // The circle in which the checkmark sits.
    const circle = (
      <div
        class={[
          'absolute top-12% left-12% w-67% h-67% border-1 border-#a9a9a9 rounded-full',
          todoCompletedRef.computedIf('bg-#a9a9a9'),
        ]}
      />
    )

    return (
      <div
        tabIndex={0}
        role="button"
        {...props}
        class={['w-24 h-24 cursor-pointer', props.class]}
        onClick={(event) => {
          event.currentTarget.focus()
          todo.status =
            todo.status == TodoStatus.Completed
              ? TodoStatus.Inactive
              : TodoStatus.Completed

          animate(circle, {
            to: { scale: 1 },
            velocity: 0.016,
            spring: { frequency: 0.22 },
          })
        }}
        onBlur={(event) => {
          if (todoCompletedRef.value) {
            const todoItem =
              event.currentTarget.closest<HTMLElement>('.todo-item')!

            const clientHeight = todoItem.clientHeight
            patchStyle(todoItem, {
              willChange: 'height',
            })

            animate(todoItem, {
              to: { opacity: 0 },
              from: { opacity: 1 },
              spring: { frequency: 0.4 },
              onChange({ opacity }) {},
            })
          }
        }}
      >
        {circle}
        <Icon
          name="check"
          class={[
            'w-24 h-24 transition-all',
            hovered || todo.status == TodoStatus.Completed
              ? 'opacity-100'
              : 'opacity-0',
            todoCompletedRef.computedIf('color-#1e1e1e', 'color-#a9a9a9'),
          ]}
        />
      </div>
    )
  }

  return (
    <div class="todo-item mr-30 border-b-1 border-#3d3d3d overflow-hidden">
      <div class="flex-row items-center py-8">
        <CompleteButton class="mr-6" />
        <span
          class={[
            'text-14 leading-1.5 py-1px',
            todoCompletedRef.computedIf('line-through color-#808080'),
          ]}
        >
          {todo.text}
        </span>
      </div>
    </div>
  )
}

function TodoCreator() {
  // Use this to show the AddTodoForm instead of the AddTodoButton.
  const [formVisible, setFormVisible] = useRef(false)

  // Use this to remount the AddTodoForm element after a todo is created. It's an easy way to reset the form and refocus the input.
  const [formId, setFormId] = useRef(uid)

  function AddTodoButton() {
    const [hovered] = useEventState('hover')

    return (
      <div
        role="button"
        class="flex-row h-33 items-center justify-start cursor-pointer"
        onClick={() => {
          setFormVisible(true)
        }}
      >
        <div class="w-24 h-24 items-center justify-center mr-6">
          <div
            class={[
              'w-17 h-17 rounded-full items-center justify-center',
              hovered ? 'color-white bg-#de4c4a' : 'color-#de4c4a',
            ]}
          >
            <Icon name="add" class="w-12 h-12" />
          </div>
        </div>
        <span
          class={[
            'text-13 font-400',
            hovered ? 'color-#de4c4a' : 'color-#808080',
          ]}
        >
          Add todo
        </span>
      </div>
    )
  }

  function AddTodoForm() {
    const todo = useRefs(() => ({
      text: '',
    }))

    const todoTextEmpty = useComputed(() => todo.text == '')

    // Unmount the form, losing all form state.
    function discard() {
      setFormVisible(false)
    }

    function submit() {
      createTodo(todo)
      setFormId(uid())
    }

    function cancel() {
      if (todo.text.length > 0) {
        document.body.append(<ConfirmDiscard />)
      } else {
        discard()
      }
    }

    function ConfirmDiscard() {
      const modalId = 'confirm-discard'
      const discardBtnId = 'discard-btn'

      const cancel = (event: AlienEvent) => {
        event.currentTarget.closest('#' + modalId)!.remove()
      }

      const confirm = (event: AlienEvent) => {
        discard()
        cancel(event)
      }

      useEffect(({ rootElement }: EffectContext) => {
        rootElement.querySelector<HTML.Button>('#' + discardBtnId)!.focus()
      }, [])

      return (
        <div
          id={modalId}
          class="fixed top-0 left-0 w-100vw h-100vh bg-black/50 items-center"
          onKeyDownCapture={(event) => {
            if (event.key === 'Enter') {
              confirm(event)
            } else if (event.key === 'Escape') {
              cancel(event)
            }
          }}
        >
          <div class="w-450 max-w-96vw bg-#1e1e1e rounded-14 px-16 py-8 mt-13vh">
            <div class="flex-row items-center mb-8">
              <h2 class="text-16 font-bold m-0">Discard changes?</h2>
              <div class="flex-1 items-end">
                <div
                  role="button"
                  class="w-32 h-32 mr--8 items-center justify-center"
                  onClick={cancel}
                >
                  <Icon name="close" class="w-24 h-24" />
                </div>
              </div>
            </div>
            <div class="mt-16 mb-32">
              <span class="text-14">
                The changes you've made won't be saved.
              </span>
            </div>
            <div class="flex-row justify-end gap-8 py-8">
              <ActionButton onClick={cancel}>Cancel</ActionButton>
              <ActionButton id={discardBtnId} color="red" onClick={confirm}>
                Discard
              </ActionButton>
            </div>
          </div>
        </div>
      )
    }

    useEffect(({ rootElement }: EffectContext) => {
      rootElement.querySelector('input')!.focus()
    }, [])

    return (
      <div class="border-#3d3d3d focus-within:border-#707070 border-1 rounded-10">
        <input
          type="text"
          class="text-14 color-white font-600 placeholder:color-#808080 p-0.7"
          placeholder="Type your todo"
          onInput={(event) => {
            todo.text = event.currentTarget.value
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              cancel()
            } else if (event.key === 'Enter' && !todoTextEmpty.value) {
              submit()
            }
          }}
        />
        <div class="flex-row justify-end gap-8 px-12 py-8 border-t-1 border-#3d3d3d">
          <ActionButton onClick={cancel}>Cancel</ActionButton>
          <ActionButton
            color="red"
            onClick={submit}
            class={todoTextEmpty.computedIf('opacity-50 pointer-events-none')}
          >
            Add todo
          </ActionButton>
        </div>
      </div>
    )
  }

  return (
    <div>{formVisible ? <AddTodoForm key={formId} /> : <AddTodoButton />}</div>
  )
}
