import { Route, Switch } from "wouter";
import AimTrainerApp from "./components/AimTrainerApp";
import IntroPage from "./pages/IntroPage";

export default function App() {
  return (
    <Switch>
      <Route path="/intro" component={IntroPage} />
      <Route path="/" component={AimTrainerApp} />
      <Route component={AimTrainerApp} />
    </Switch>
  );
}
