const GeneratorFunction = function*(){}.constructor;

export const TICK_ADD = 'TICK_ADD';
export const TICK_PAUSE = 'TICK_PAUSE';
export const TICK_RESUME = 'TICK_RESUME';

export const addTick = actionCreator => ({
  type: TICK_ADD,
  actionCreator
});

export const pauseTicks = () => ({
  type: TICK_PAUSE
});

export const resumeTicks = () => ({
  type: TICK_RESUME
});

//Note: You have to start the interval yourself, by dispatching resumeTicks
export const tickMiddleware = store => {
  let interval;
  let subscribers = [];
  function startInterval() {
    interval = setInterval(() => {
      subscribers.forEach(async tickArgs => {
        const [actionCreator, lastTime, resolver] = tickArgs;
        const dt = Date.now() - lastTime;
        tickArgs[1] = Date.now();
        const result = await store.dispatch(actionCreator(dt));
        if(result) {
          subscribers = subscribers.filter(([_, __, rr]) => rr !== resolver);
          resolver();
        }
      });
    }, 1);
  }

  function clearInterval() {
    window.clearInterval(interval);
  }

  return next => action => {
    if(action.type === TICK_ADD) {
      return new Promise(resolve => subscribers.push([action.actionCreator, Date.now(), resolve]));
    } else if(action.type === TICK_PAUSE) {
      clearInterval();
    } else if(action.type === TICK_RESUME) {
      startInterval();
    } else {
      return next(action);
    }
  };
};
