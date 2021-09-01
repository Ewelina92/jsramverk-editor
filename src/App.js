import React from "react";
import {
	BrowserRouter as Router,
	Switch,
	Route,
} from "react-router-dom";
import 'react-quill/dist/quill.snow.css';
import './App.css';
import DocumentList from "./DocumentList";
import Navbar from "./Navbar";
import Editor from "./Editor";

function App() {
	return (
		<>
			<Navbar />
			<Router>
				<Switch>
					<Route exact path="/">
						<DocumentList />
					</Route>
					<Route exact path="/editor">
						<Editor />
					</Route>
					<Route path="/editor/:id">
						<Editor />
					</Route>
				</Switch>
			</Router>
		</>
	);
}

export default App;
