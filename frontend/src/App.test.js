import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";
import WorkoutStats from "./components/WorkoutStats";
import WorkoutCard from "./components/WorkoutCard";
import { AuthContextProvider } from "./context/AuthContext";
import { WorkoutsContextProvider } from "./context/WorkoutContext";
import { ThemeContextProvider } from "./context/ThemeContext";

jest.mock("date-fns/formatDistanceToNow", () => () => "just now");

jest.mock(
  "react-router-dom",
  () => {
    const ReactLib = require("react");
    return {
      BrowserRouter: ({ children }) => <div>{children}</div>,
      Routes: ({ children }) => {
        const list = ReactLib.Children.toArray(children);
        const loginRoute = list.find((child) => child.props.path === "/login");
        const homeRoute = list.find((child) => child.props.path === "/");
        return (loginRoute || homeRoute || list[0])?.props.element || null;
      },
      Route: ({ element }) => element || null,
      Navigate: ({ to }) => <div data-testid={`navigate-${to}`} />,
      Link: ({ to, children, ...rest }) => (
        <a href={to} {...rest}>
          {children}
        </a>
      ),
      useLocation: () => ({ pathname: "/login" }),
    };
  },
  { virtual: true }
);

const wrapWithProviders = (ui) =>
  render(
    <ThemeContextProvider>
      <AuthContextProvider>
        <WorkoutsContextProvider>{ui}</WorkoutsContextProvider>
      </AuthContextProvider>
    </ThemeContextProvider>
  );

test("renders Workout Buddy navbar and theme toggle", () => {
  localStorage.clear();
  wrapWithProviders(<App />);

  expect(screen.getByText("Workout Buddy")).toBeInTheDocument();
  expect(screen.getByText(/Supabase Edition/i)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Continue with Google/i })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Switch to light mode/i })
  ).toBeInTheDocument();
});

test("calculates workout summary stats accurately", () => {
  const sample = [
    { id: "1", title: "Bench Press", load: 80, sets: 3, reps: 10 },
    { id: "2", title: "Pull-ups", load: 0, sets: 4, reps: 12 },
  ];

  render(<WorkoutStats workouts={sample} />);

  expect(screen.getByText("2")).toBeInTheDocument();
  expect(screen.getByText("2,400 kg")).toBeInTheDocument();
  expect(screen.getByText("78")).toBeInTheDocument();
  expect(screen.getByText("80 kg")).toBeInTheDocument();
});

test("renders workout card metrics and switches into inline edit mode", () => {
  const workout = {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Deadlift",
    category: "Strength",
    load: 120,
    sets: 3,
    reps: 5,
    notes: "Beltless",
    created_at: new Date().toISOString(),
  };

  wrapWithProviders(<WorkoutCard workout={workout} />);

  expect(screen.getByText("Deadlift")).toBeInTheDocument();
  expect(screen.getByText("120 kg")).toBeInTheDocument();
  expect(screen.getByText("3 × 5")).toBeInTheDocument();
  expect(screen.getByText("1,800 kg")).toBeInTheDocument();
  expect(screen.getByText("Beltless")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /Edit Deadlift/i }));
  expect(screen.getByText(/Editing Workout/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Save Changes/i })).toBeInTheDocument();
});
