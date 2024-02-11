"use client";
import * as React from "react"


export const reducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_DRAWER":
        let val = action.showDrawer;
        if (val === "toggle") {
            val = !state.showDrawer;
        }
        return { showDrawer: !state.showDrawer };
  }
}

const listeners = []

let memoryState = { showDrawer: false }

function dispatch(action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

function toggleDrawer(val) { dispatch({ type: "TOGGLE_DRAWER", showDrawer: val }); }

function useDrawer() {
  const [state, setState] = React.useState(memoryState);

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    };
  }, [state])

  return {
        ...state,
        toggleDrawer,
    };
}

export { useDrawer, toggleDrawer }
