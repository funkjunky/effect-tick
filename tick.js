const GeneratorFunction = function*(){}.constructor;

export const TICK_ADD = 'TICK_ADD';
export const TICK_PAUSE = 'TICK_PAUSE';
export const TICK_RESUME = 'TICK_RESUME';

export const addTick = (actionCreator, curTime = Date.now()) => ({
  type: TICK_ADD,
  actionCreator,
  curTime,
});

export const pauseTicks = () => ({
  type: TICK_PAUSE
});

export const resumeTicks = () => ({
  type: TICK_RESUME
});

const defaultInterval = cb => {
  const h = setInterval(() => cb(Date.now()), 100);
  return () => window.clearInterval(h);
};

//Note: You have to start the interval yourself, by dispatching resumeTicks
export const tickMiddleware = (registerInterval = defaultInterval) => store => {
  let clearInterval;
  let subscribers = [];

  function startInterval() {
    clearInterval = registerInterval(curTime => {
      subscribers.forEach(async tickArgs => {
        const [actionCreator, lastTime, resolver] = tickArgs;
        const dt = curTime - lastTime;
        tickArgs[1] = curTime;
        const result = await store.dispatch(actionCreator(dt));
        if(result) {
          subscribers = subscribers.filter(([_, __, rr]) => rr !== resolver);
          resolver();
        }
      });
    });
  }

  return next => action => {
    if(action.type === TICK_ADD) {
      return new Promise(resolve => subscribers.push([action.actionCreator, action.curTime || Date.now(), resolve]));
    } else if(action.type === TICK_PAUSE) {
      clearInterval && clearInterval();
      clearInterval = null;
    } else if(action.type === TICK_RESUME) {
      startInterval();
    } else {
      return next(action);
    }
  };
};
