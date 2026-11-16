import { createContext, useReducer } from "react";

export const WorkoutsContext = createContext();

const getWorkoutKey = (workout) => workout?.id || workout?._id;

export const workoutsReducer = (state, action) => {
  switch (action.type) {
    case "SET_WORKOUTS":
      return {
        workouts: action.payload,
      };
    case "CREATE_WORKOUT":
      return {
        workouts: [action.payload, ...(state.workouts || [])],
      };
    case "UPDATE_WORKOUT": {
      const updatedId = getWorkoutKey(action.payload);
      return {
        workouts: (state.workouts || []).map((workout) =>
          getWorkoutKey(workout) === updatedId ? action.payload : workout
        ),
      };
    }
    case "DELETE_WORKOUT": {
      const deletedId = getWorkoutKey(action.payload);
      return {
        workouts: (state.workouts || []).filter(
          (workout) => getWorkoutKey(workout) !== deletedId
        ),
      };
    }
    default:
      return state;
  }
};

export const WorkoutsContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(workoutsReducer, { workouts: null });

  return (
    <WorkoutsContext.Provider value={{ ...state, dispatch }}>
      {children}
    </WorkoutsContext.Provider>
  );
};
