'use strict';

exports.__esModule = true;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

exports.placeReducer = placeReducer;
exports.connectReducerMiddleware = connectReducerMiddleware;
exports.connectReducer = connectReducer;

var _react = require('react');

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _lodash = require('lodash');

var _hoistNonReactStatics = require('hoist-non-react-statics');

var _hoistNonReactStatics2 = _interopRequireDefault(_hoistNonReactStatics);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO: Get the shape from redux
var storeShape = _react.PropTypes.shape({
  subscribe: _react.PropTypes.func.isRequired,
  dispatch: _react.PropTypes.func.isRequired,
  getState: _react.PropTypes.func.isRequired
});

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

// Store reducers that are initialized by non React Components
var cachedReducer = void 0;

var ACTION_TYPE = '@@connectReducer';

// Add a reducer in a path separated by dot, ex: 'foo.bar' = { foo: { bar: reducer } };
function placeReducer(path, reducer) {
  var _nextState;

  if (!path) {
    throw new Error('The path must be defined.');
  }

  // TODO: Optimize this script...

  var steps = path.split('.');
  var firstStep = steps.shift();
  var lastStep = steps.pop();

  var nextState = (_nextState = {}, _nextState[firstStep] = {}, _nextState);
  var initialState = nextState;

  if (lastStep) {
    nextState = nextState[firstStep];

    steps.forEach(function (step) {
      nextState[step] = {};
      nextState = nextState[step];
    });

    nextState[lastStep] = undefined;
  } else {
    nextState[firstStep] = undefined;
  }
  nextState = undefined;

  function change(state, reducerState) {
    var newState = (0, _extends3.default)({}, state);
    if (lastStep) {
      nextState = newState[firstStep];

      steps.forEach(function (step) {
        nextState = (0, _extends3.default)({}, nextState[step]);
      });

      nextState[lastStep] = reducerState;
    } else {
      newState[firstStep] = reducerState;
    }

    return newState;
  }

  return function () {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
    var action = arguments[1];

    var currentState = (0, _lodash.get)(state, path);
    var reducerState = reducer(currentState, action);
    var hasNotChanged = (0, _lodash.isEqual)(currentState, reducerState);
    return hasNotChanged ? state : change(state, reducerState);
  };
}

function connectReducerMiddleware(reducer) {
  function connectReducerAction() {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var action = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (action.type === ACTION_TYPE) {
      return (0, _assign2.default)({}, state, action.payload);
    }
    return reducer(state, action);
  }

  cachedReducer = reducer;
  return connectReducerAction;
}

// TODO: Use a map
var reducersList = new _set2.default();

function connectReducer(reducer) {
  var cachedInitialState = void 0;

  var hasInitialized = reducersList.has(reducer);
  if (!hasInitialized) {
    reducersList.add(reducer);
  }

  var nextReducer = function nextReducer(state, action) {
    var cachedState = state && (0, _lodash.pick)(state, (0, _lodash.keys)(cachedInitialState));
    // TODO: User lodash reducer here
    var result = state;
    reducersList.forEach(function (listReducer) {
      result = (0, _extends3.default)({}, listReducer(result, action));
    });
    var cachedReducerResult = cachedReducer(cachedState, action);
    var nextState = (0, _extends3.default)({}, state);
    (0, _lodash.keys)(cachedReducerResult).forEach(function (key) {
      if (state[key] !== cachedReducerResult[key]) {
        nextState[key] = cachedReducerResult[key];
      }
    });
    (0, _lodash.keys)(result).forEach(function (key) {
      if (state[key] !== result[key]) {
        nextState[key] = result[key];
      }
    });

    return nextState;
  };

  return function wrapWithConnectReducers(WrappedComponent) {
    var displayName = 'ConnectReducers(' + getDisplayName(WrappedComponent) + ')';

    var ConnectReducer = function (_Component) {
      (0, _inherits3.default)(ConnectReducer, _Component);

      function ConnectReducer(props, context) {
        (0, _classCallCheck3.default)(this, ConnectReducer);

        var _this = (0, _possibleConstructorReturn3.default)(this, _Component.call(this, props, context));

        _this.store = props.store || context.store;

        (0, _invariant2.default)(_this.store, 'Could not find "store" in either the context or ' + ('props of "' + displayName + '". ') + 'Either wrap the root component in a <Provider>, ' + ('or explicitly pass "store" as a prop to "' + displayName + '".'));

        var _this$store = _this.store,
            replaceReducer = _this$store.replaceReducer,
            getState = _this$store.getState;


        cachedInitialState = cachedReducer(undefined, {});
        if (!hasInitialized && !(0, _lodash.isEqual)(getState(), nextReducer(getState(), {}))) {
          replaceReducer(nextReducer);
          hasInitialized = true;
        }
        return _this;
      }

      ConnectReducer.prototype.componentWillMount = function componentWillMount() {
        var _store = this.store,
            dispatch = _store.dispatch,
            replaceReducer = _store.replaceReducer;


        if (nextReducer !== this.nextReducer) {
          replaceReducer(nextReducer);
          this.nextReducer = nextReducer;

          dispatch({
            type: ACTION_TYPE,
            payload: reducer(undefined, {})
          });
        }
      };

      ConnectReducer.prototype.render = function render() {
        return (0, _react.createElement)(WrappedComponent, this.props);
      };

      return ConnectReducer;
    }(_react.Component);

    ConnectReducer.displayName = displayName;
    ConnectReducer.WrappedComponent = WrappedComponent;

    ConnectReducer.contextTypes = {
      store: storeShape
    };

    ConnectReducer.propTypes = {
      store: storeShape
    };

    return (0, _hoistNonReactStatics2.default)(ConnectReducer, WrappedComponent);
  };
}

