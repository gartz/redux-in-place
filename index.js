import { Component, createElement, PropTypes } from 'react';
import invariant from 'invariant';
import { get, pick, keys, every } from 'lodash';

import hoistStatics from 'hoist-non-react-statics';

// TODO: Get the shape from redux
const storeShape = PropTypes.shape({
  subscribe: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
  getState: PropTypes.func.isRequired
});

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

// Store reducers that are initialized by non React Components
let cachedReducer;

const ACTION_TYPE = '@@connectReducer';

// Add a reducer in a path separated by dot, ex: 'foo.bar' = { foo: { bar: reducer } };
export function placeReducer(path, reducer) {
  if (!path) {
    throw new Error('The path must be defined.');
  }

  // TODO: Optimize this script...

  const steps = path.split('.');
  const firstStep = steps.shift();
  const lastStep = steps.pop();

  let nextState = {
    [firstStep]: {}
  };
  const initialState = nextState;

  if (lastStep) {
    nextState = nextState[firstStep];

    steps.forEach((step) => {
      nextState[step] = {};
    nextState = nextState[step];
  });

    nextState[lastStep] = undefined;
  } else {
    nextState[firstStep] = undefined;
  }
  nextState = undefined;

  function change(state, reducerState) {
    const newState = { ...state };
    if (lastStep) {
      nextState = newState[firstStep];

      steps.forEach((step) => {
        nextState = { ...nextState[step] };
    });

      nextState[lastStep] = reducerState;
    } else {
      newState[firstStep] = reducerState;
    }

    return newState;
  }

  return (state = initialState, action) => {
    const currentState = get(state, path);
    const reducerState = reducer(currentState, action);
    const hasNotChanged = currentState === reducerState;
    return hasNotChanged ? state : change(state, reducerState);
  };
}

export function connectReducerMiddleware(reducer) {
  function connectReducerAction(state = {}, action = {}) {
    if (action.type === ACTION_TYPE) {
      return Object.assign({}, state, action.payload);
    }
    return reducer(state, action);
  }

  cachedReducer = reducer || (state => state);
  return connectReducerAction;
}

// TODO: Use a map
const reducersList = new Set();

export function connectReducer(reducer) {
  let cachedInitialState;

  let hasInitialized = reducersList.has(reducer);
  if (!hasInitialized) {
    reducersList.add(reducer);
  }

  const nextReducer = (state, action) => {
    const cachedState = state && pick(state, keys(cachedInitialState));
    // TODO: User lodash reducer here
    let result = state;
    reducersList.forEach((listReducer) => {
      result = {
        ...listReducer(result, action)
      };
    });
    const cachedReducerResult = cachedReducer(cachedState, action);
    const nextState = { ...state };
    keys(cachedReducerResult).forEach(key => {
      if (state[key] !== cachedReducerResult[key]) {
        nextState[key] = cachedReducerResult[key];
      }
    });
    keys(result).forEach(key => {
      if (state[key] !== result[key]) {
        nextState[key] = result[key];
      }
    });
    
    const isEveryPropEqualsCurrentState = every(keys(nextState), (key) => (nextState[key] === state[key]));

    return isEveryPropEqualsCurrentState ? state : nextState
    ;
  };

  return function wrapWithConnectReducers(WrappedComponent) {
    const displayName = `ConnectReducers(${getDisplayName(WrappedComponent)})`;

    class ConnectReducer extends Component {
      constructor(props, context) {
        super(props, context);

        this.store = props.store || context.store;

        invariant(this.store,
          'Could not find "store" in either the context or ' +
          `props of "${displayName}". ` +
          'Either wrap the root component in a <Provider>, ' +
          `or explicitly pass "store" as a prop to "${displayName}".`
        );

        const { replaceReducer, getState } = this.store;

        cachedInitialState = cachedReducer(undefined, {});
        if (!hasInitialized && getState() !== nextReducer(getState(), {})) {
          replaceReducer(nextReducer);
          hasInitialized = true;
        }
      }

      componentWillMount() {
        const { dispatch, replaceReducer } = this.store;

        if (nextReducer !== this.nextReducer) {
          replaceReducer(nextReducer);
          this.nextReducer = nextReducer;

          dispatch({
            type: ACTION_TYPE,
            payload: reducer(undefined, {})
          });
        }
      }

      render() {
        return createElement(WrappedComponent, this.props);
      }
    }

    ConnectReducer.displayName = displayName;
    ConnectReducer.WrappedComponent = WrappedComponent;

    ConnectReducer.contextTypes = {
      store: storeShape
    };

    ConnectReducer.propTypes = {
      store: storeShape
    };

    return hoistStatics(ConnectReducer, WrappedComponent);
  };
}

export default connectReducer;
