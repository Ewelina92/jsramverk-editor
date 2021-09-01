import React, { useState } from "react";
import {
	BrowserRouter as Router,
	Switch,
	Route,
} from "react-router-dom";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './App.css';
import Toolbar from "./Toolbar";
import DocumentList from "./DocumentList";
import Navbar from "./Navbar";

function App() {
	const [value, setValue] = useState('');

	return (
		<>
			<Navbar />
			<Router>
				<Switch>
					<Route exact path="/">
						<DocumentList />
					</Route>
					<Route path="/editor">
						<Toolbar value={value} />
						<ReactQuill theme="snow" value={value} onChange={setValue} />
					</Route>
				</Switch>
			</Router>
		</>
	);
}

// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

export default App;
