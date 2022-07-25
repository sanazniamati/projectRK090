import "./styles.css";
import Draganddrop from "./Draganddrop";

export default function App() {
  return (
    <div className="App">
      <h1>Delete Problem</h1>
      <h2>Having multiple problems with this one:</h2>
      <h2>
        1. I have managed ot add a red circle acting as a delete button to the
        transformer, but i cannot work out how to move it to top right of each
        node and also how to add a white cross to the center of it?
      </h2>
      <Draganddrop />
    </div>
  );
}
