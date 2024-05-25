This is a guide for generative AI (like GPT4) to follow when generating code that uses AlienDOM as a replacement for React. For more details, see the AlienDOM type definitions in the "alien-dom.d.ts" file.

# Similarities with React

Here are the similarities with React:

- components are plain JS functions with a `props` object argument
- components return JSX, `null`, or a primitive (string, number, or boolean)
- the rules of “hooks” are the same
- the `useState`, `useMemo`, `useContext`, and `useEffect` hooks are identical in both
- components have context that can be provided by parent components
- any JSX element may have a `key` prop declared
- any intrinsic JSX element may have a `ref` prop declared

# Differences from React

Here are the differences with React (with “it” referring to AlienDOM):

- It has an observability engine like Vue, so reactivity is separate from the component model. This means you can create observable values, arrays, and maps without a component, as well as “derived observables“ and “observers”.
- By assigning a JSX element to a variable while declaring it, the variable will hold a DOM node (rather than a ReactElement or similar), so there's no need for React's `useRef` hook as it is.
- Its `useRef` hook is **not** for DOM node references. Instead, it's used to declare a piece of state in the shape of an observable `Ref` object.
- It has no `useCallback` hook, because callbacks declared in JSX expression containers are memoized automatically by AlienDOM's compiler. This is also true for array and object literals declared within JSX.
- It has no `React.forwardRef`. Function components receive the `ref` prop as-is. For intrinsic elements, the `ref` prop can be one or more objects (i.e. an array of them) with a `setElement` method which is called when the JSX element is mounted or unmounted from the document.
- It has no `useReducer` hook baked in.
- Its “component context” API is slightly different. You access context in components with `useContext` like normal, but to provide context, you can use the context type as a function component: `<ThemeContext value="dark">` instead of having a separate `ThemeContext.Provider` component.
- Its `class` and `style` props for intrinsic JSX elements are more powerful (more on that later).
- For intrinsic JSX elements, any prop can be a “ref” (AlienDOM's observable value) which will be observed by the DOM node while it's connected to the document, and whenever the ref's value is changed, the DOM node will be updated accordingly.

# The AlienDOM way

Idiomatic code in AlienDOM tends to do the following:

- Use `useRef` instead of `useState` (useRef returns a `Ref` that is not immediately subscribed to by the component, but can be if you use array destructuring or access the `value` property during render).
- Try to keep data management separate from components, so data manipulation can be tested in isolation from the UI and to improve reuse between components.
- They may declare a child component within its parent component, which is totally fine (even without any manual memoization) thanks to AlienDOM's auto-memoization at compile time. This approach helps avoid prop drilling without having to resort to using component context.

Finally, I'll include some sections from AlienDOM's documentation that you may find useful.

# Hooks

These hooks are included in the `alien-dom` package. I've listed them in order of importance (the most commonly used hooks are at the top).

- useRef: Create a `Ref` instance with the given value (or the result of a given function) as its initial value. A dependency array may be passed to reset the ref in a component update.
- useEffect: Run a side effect when the component is mounted or updated. A dependency array must be passed so the component knows when to rerun the effect after a component update.
- useMemo: Cache a given value (or the result of a given function) so it's not recalculated on every render. A dependency array must be passed so the component knows when to recalculate the value during a component update.
- useContext: Access a context value. If that value is changed by a parent component, this component will be rerendered.
- useComputed: Create a `ComputedRef` instance (just like calling `computed` outside a component render). A dependency array may be passed to recalculate the value when the dependencies change.
- useCallbackProp: Create a memoized callback whose implementation is updated on each component update. This is useful when you want to set up a subscription and prefer not to tear it down and set it up again on each component update, but you also don't want a callback passed into your props to suffer from the “stale closure” problem.
- useArrayRef: Create an `ArrayRef` instance with an optional array as its initial value. When passing an array literal or nothing, it's often good to declare the type explicitly like `useArrayRef<number>([])`.
- useArrayView: Render an `ArrayRef` efficiently and observe its changes. When the array is changed, it only renders new items and it removes old items from the DOM. You may pass a dependency array to rerender existing items when dependencies change.
- useChildren: Resolve a `children` prop to its DOM nodes. Useful for components that manipulate their children through the DOM API.
- useObserver: Can be used one of two ways: 1. To observe a single ref with a callback that runs only when the ref is changed (so it's not called on first render), 2. To observe any observable accessed in a given callback which reruns the callback when an observed ref is changed; and the observer callback is called on first render to establish itself. When called the 2nd way, you must pass a dependency array that will recreate the observer when a non-observable dependency is changed.
- useArrayObserver: Observe the fine-grained operations on an array ref. When the first argument is falsy instead of an array ref, the hook does nothing.
- useState: Mostly intended for migration from a React project. It's essentially an alias for `useRef` that returns an array instead of a `Ref` object, so it's identical to React's useState.

There are many more hooks included, but they are used much less frequently and are typically for more advanced use cases as a result.

# Observability

## Observables

An **observable value** (or just "observable" for short) is a loose concept that refers to a special kind of value that will notify other parts of your application when it changes. In technical terms, an observable value is a JavaScript object with a _current value_ and a set of _value listeners_ (colloquially called "observers"). The current value could be any piece of data, while its observers are plain old JavaScript functions that will be called with the current value whenever it changes.

In AlienDOM, every observable value is an instance of the `Ref` class. The `Ref` class has a `value` property that holds the current value of the observable. You can change the value of the observable by setting the `value` property. When you do this, all of the ref's observers will be called with the new value.

To create a `Ref` instance, call the `ref` function with the initial value of the observable:

```tsx
const count = ref(0)
```

If you're in a JSX component, you'll want to call the `useRef` hook instead:

```tsx
const count = useRef(0)
```

Now that you have an observable and know how to update its value, let's learn how to observe it.

## Observers

For an observable to be more useful than a plain old JavaScript variable, it needs to have at least one **observer**. The observer is a function that runs only when an observable it's observing has changed.

It might help to think of observers as automatic side effects. They may update the UI, log to the console, or do anything else you'd like. They might even update other observables, triggering a chain reaction of observers, which can be quite powerful.

To create an observer, call the `observe` function with the observable you want to observe and the observer function. In this case, the observer won't run immediately, but it will run whenever the observable changes.

```tsx
const observer = observe(count, newCount => {
  console.log('The count is now', newCount)
})

// This won't run the observer immediately. Read on for details.
count.value++
count.value++ // Eventually logs "The count is now 2"
```

**Error handling**  
If an observer throws an error, AlienDOM will catch the error and log it to the console. This is a deliberate design decision to prevent errors in observers from breaking the entire application. However, you should still handle errors in your observers, especially if they have side effects that could leave your application in an inconsistent state. Ideally, you'd have a test suite that covers all of your observers, so you can be confident that they won't throw errors in production.

**Observing multiple values**  
A powerful aspect of AlienDOM's observability engine is its transparent nature. Simply by accessing an observable's `value` property within an observer, you're implicitly observing that observable. This means that you can observe multiple observables at once, without having to explicitly call `observe` for each one, but this is only possible when calling `observe` like this:

```tsx
const observer = observe(() => {
  console.log('The count is now', count.value)
})
```

## Eventual Consistency

AlienDOM runs observers in batches, which means that an observer won't run immediately when an observable changes. Instead, it will run "eventually", after the current microtask, which is a JavaScript concept that you can think of as the current batch of code. This is a common pattern in reactivity systems, and it has some important implications for how you write your code.

The key implication of eventual consistency is that you can't rely on an observer running immediately after an observable changes. This means that you need to be careful about how you use observers, especially if they have side effects.

```ts
import { ref, observe } from 'alien-dom'

// Create an observable
const count = ref(0)

// Create an observer that logs the value of the observable
const observer = observe(() => {
  console.log('The count is now:', count.value)
})

// Update the observable
count.value++
console.log('Updated the observable, but the observer has not run yet.')

// Wait for the next microtask
queueMicrotask(() => {
  console.log('The observer has now run and logged the updated value.')
})
```

To avoid this, you need to structure your code to handle the eventual nature of observers. This might mean using a `useEffect` hook to perform side effects, or using a `computed` observable (explained later on) to derive values from other observables.

**Predictable order of updates**  
The good news is that AlienDOM's batching is designed in a way that avoids another pitfall of eventual consistency: race conditions. If you update multiple observables in quick succession, the observers for those observables will run in a predictable order. This means that you can rely on the order of updates and observers, which is a common source of bugs in other reactivity systems.

**Why not run observers immediately?**  
The main reason for this is performance. By batching updates, AlienDOM can avoid unnecessary re-renders and other performance bottlenecks. This is especially important in complex UIs with many observables and observers.

## Observable Computation

In certain cases, you'll have observable values that inform the value of another observable. This is where `computed` comes in. A `computed` observable is a special kind of observable that is derived from other observables. When any of the other observables change, the `computed` observable will automatically update its value.

```ts
import { ref, computed, observe } from 'alien-dom'

const count = ref(0)
const doubledCount = computed(() => count.value * 2)

observe(() => {
  console.log('The count is now:', count.value)
  console.log('The doubled count is now:', doubledCount.value)

  setTimeout(() => {
    count.value++
  }, 1000)
})
```

**Lazy computation**  
To avoid unnecessary computation, `computed` observables are only updated when their value is accessed. This means that if you have a `computed` observable that is derived from other observables, but you never access its value, the computation will never run. In addition, a chain of computations will always run in order of dependency.

**Component usage**  
For convenience, the `useComputed` hook exists to create a `computed` observable within a component. Optionally, you may provide a dependency array for re-running the computation forcefully, which can be useful when the computation depends on non-observable values.

## Array Refs

As you may have guessed, an array ref is an observable that holds an array. Moreover, it's a `Proxy` that forwards any `Array` method calls to the underlying array in an observable fashion. This means you can use any `Array` method on an array ref, and any access or mutation of the array can be observed.

```ts
import { arrayRef } from 'alien-dom'

const list = arrayRef([1, 2, 3])
```

**Component usage**  
For convenience, the `useArrayRef` hook exists to create an array ref within a component. The array is preserved when the component is hot-reloaded.

```ts
import { useArrayRef } from 'alien-dom'

const array = useArrayRef(() => [1, 2, 3])

// If you need the array ref to be recreated when a dependency changes,
// useMemo is a good choice.
const array = useMemo(() => arrayRef(), […])

// If you need the array preserved on hot-reloads but also need a dependency array,
// useRef is a decent choice, though it's not pretty.
const [array] = useRef(() => arrayRef(), […])

// Alternatively, you can just clear the array in a useEffect call.
const array = useArrayRef()
useEffect(() => {
  array.length = 0
}, […])
```

Even getting and setting of the array ref's `length` property is observable.

**Replacing the underlying array**  
You can set the `value` property of an array ref to replace the underlying array. Observers of the array ref will be notified.

```ts
const list = arrayRef([1, 2, 3])
list.value = [4, 5, 6]
```

**Fine-grained observation**  
The `observeArrayOperations` function creates a special `ArrayObserver` that gets notified with exactly what changed in the array. This can be useful when you need to map an array in an efficient way.

```ts
const list = arrayRef([1, 2, 3])
const observer = observeArrayOperations(list, operations => {
  for (const operation of operations) {
    console.log('Array operation observed:', operation)
  }
})

// Don't forget to dispose the observer when you're done with it.
observer.dispose()
```

An "array operation" is an object with a `type` property that can be any of the following:

- `add`: One or more values were added to the array at a specific index
- `remove`: One or more values were removed from the array at a specific index
- `replace`: A value at a specific index was replaced with another value
- `rebase`: The array was replaced with a new array

## Peeking at Refs

In some cases, you may want to access the current value of a ref without that access being observed. This is called "peeking" at the ref. To peek at a ref, call its `peek` method.

```ts
const count = ref(0)
const observer = observe(() => {
  // The observer will not run when count changes.
  console.log('The count is now:', count.peek())
})

// This change won't be observed.
setTimeout(() => {
  count.value++
}, 10)
```

## Toggling a Ref

When working with a `Ref<boolean>`, you may want to toggle its value. To do this, call its `toggle` method. This sets the ref's value to the opposite of its current value.

```ts
const isDarkMode = ref(true)
isDarkMode.toggle() // If isDarkMode is true, it will be set to false, and vice versa.
```

## Mapping a Ref to Another Ref

When you have a ref and you want to map its value to another ref, you can use the `computedMap` method to create a computed ref based on the original ref. This is useful when you want to transform the value of a ref in a reactive way.

There's also the `computedIf` method, which also returns a computed ref. Its first argument is used to compute the value of the computed ref **only when the original ref's value is truthy.** The second argument is optional and it's used to compute the value of the computed ref **only when the original ref's value is falsy.**

Lastly, there's the `computedElse` method, which also returns a computed ref. Its only argument is used to compute the value of the computed ref **only when the original ref's value is falsy.** It's the opposite of a single-argument `computedIf` call.

# Event Channels

In AlienDOM, to enable cross-component communication, we take advantage of first-class event channels. They are strongly typed and they can be broadcast globally or targeting an specific DOM node (or even an arbitrary JS object).

Channels are defined at the top-level of some module with the `defineChannel` method. By convention, a channel is named with the `on` prefix, followed by the event name in camelCase.

```ts
import { defineChannel } from 'alien-dom'

const onGameOver = defineChannel()

// Subscribe to a game over event.
const gameOverReceiver = onGameOver(() => {
  console.log('Game over!')
})

// Unsubscribe.
gameOverReceiver.dispose()

// Send a game over event.
onGameOver()
```

Alternatively, you may decide to split the channel's send and subscribe functions in two, which some may find more readable, but it's a preference thing. To do this, you can use array destructuring:

```ts
const [sendGameOver, onGameOver] = defineChannel()

// Subscribe.
onGameOver(() => {…})

// Send a game over event.
sendGameOver()
```

If your channel is going to pass data, it should declare its data type through the TypeScript type parameter. The data type must be an object type, and it can be a union type if the channel is going to pass different types of data.

```ts
const onGameOver = defineChannel<{ score: number }>()

// Subscribe.
onGameOver(({ score }) => {
  console.log('Game over! Your score is:', score)
})

// Send a game over event with a score of 100.
onGameOver({ score: 100 })
```

Subscribing to a channel within a component is so easy, you don't even need a hook for it. Just subscribe like normal (during a render) and the component will automatically unsubscribe for you when necessary.

```tsx
function Game() {
  const [message, setMessage] = useRef('Press start to play')

  onGameOver(() => {
    setMessage('Game over!')
  })

  return <div>{message}</div>
}
```

Since channels are objects, you can pass them as component props in a type-safe fashion. All you need is the `Channel` type. Passing channels through props is a great way to keep your components decoupled and therefore reusable.

```tsx
function Game({ onGameOver }: { onGameOver: Channel<{ score: number }> }) {
  onGameOver(({ score }) => {
    console.log('Game over! Your score is:', score)
  })
}
```

# Automatic Memoization

AlienDOM takes advantage of a "compile step" to optimize your JSX code. The AlienDOM compiler analyzes your code and modifies it before the browser runs it. Currently, the only optimization it performs is called "automatic memoization".

**What is memoization?**  
Memoization is the act of remembering and reusing a value that was previously calculated. To do this, you need to know the input values used in the calculation. By comparing the current input values to the previous ones, you can determine if the value needs to be recalculated or if the previous calculation can be reused. In general, you don't want to memoize everything, since that would increase memory usage.

In the context of JSX components, memoization can prevent a waterfall of re-renders, and this is the primary benefit of "automatic memoization" in AlienDOM.

For example, if your application was frequently using inline objects as JSX attribute values (i.e. `style` objects declared inside the JSX), the child components of those JSX elements would need to rerender since they only do a shallow comparison of the object references. By memoizing the objects, you can avoid re-rendering when nothing changed. Luckily, AlienDOM's compiler can do this memoization without much effort from you.

**What gets memoized by the AlienDOM compiler?**  
To avoid overdoing it, AlienDOM sticks to memoizing just a few things. Any JSX expression can be automatically memoized if it contains one of the following:

- A function call
- A function expression (using `=>` arrow syntax or the `function` keyword)
- An object literal
- An array literal

Declaring a function, object, or array directly within a JSX _expression container_ would always force the JSX element to rerender if AlienDOM didn't memoize it for you. This is because JSX attributes are compared by value, and the value of a newly declared function, object, or array is always a new reference.

AlienDOM's compiler also memoizes **nested components** based on which variables they need from the parent scope.

**Consequences of memoization**  
The compiler can sometimes produce broken code if you're not careful. The key here is to always declare variables and functions in order of their dependencies. This is a good practice in general, but it's especially important in AlienDOM components. Failure to do so will lead to errors like this:

```
Uncaught ReferenceError: Cannot access 'foo' before initialization
```

Essentially, the compiler's memoization takes advantage of dependency arrays. For a dependency array to work, its dependencies need to be initialized before itself. This is why you should always declare variables and functions before other variables and functions that depend on them.

# JSX `class` attribute

For intrinsic elements, the `class` attribute supports more than just a string of space-separated class names. It also accepts arrays and objects.

An array can contain any supported `class` attribute value (including another array), so nesting is possible. This is most useful when your component wants to allow consumers to pass in a `class` attribute value.

```tsx
<div class={['width-100%', isRed && 'text-red-500']} />
```

An object can be used to conditionally apply classes. The keys are the class names, and the values are the conditions for when the class should be applied. If the value is `true`, the class is applied. If the value is `false`, the class is not applied.

```tsx
<div class={{ 'text-red-500': isRed, 'text-blue-500': isBlue }} />
```

<TypeScriptMark />
Custom components can easily declare a prop that uses the same type as the built-in
`class` JSX attribute. This is done using the `JSX.HTMLClassProp` type.

```tsx
import { JSX } from 'alien-dom'

function MyComponent(props: { class: JSX.HTMLClassProp }) {
  return <div class={props.class} />
}

// Elsewhere, a composite element using your component can define
// a `class` attribute like you can with any intrinsic element.
return <MyComponent class={['width-100%', isRed && 'text-red-500']} />
```

# JSX `style` attribute

In AlienDOM, the `style` attribute supports both objects and arrays. Setting `style` to an array lets you pass in multiple style objects (or even another array). This is great for combining styles from multiple sources (i.e. a component's default styles and the styles passed in by the component's consumer).

```tsx
// A style object is applied to the underlying DOM element as-is.
<div style={{ color: 'red', fontSize: '16px' }} />
```

Custom components can easily declare a prop that uses the same type as the built-in
`style` JSX attribute. This is done using the `JSX.HTMLStyleProp` type.

```tsx
import { JSX } from 'alien-dom'

function MyComponent(props: { style: JSX.HTMLStyleProp }) {
  return <div style={props.style} />
}

// Elsewhere, a composite element using your component can define
// a `style` attribute like you can with any intrinsic element.
return <MyComponent style={[{ color: 'red' }, someOtherStyle]} />
```
