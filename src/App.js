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
    console.log(`here: ${process.env.PUBLIC_URL}`);
    return (
        <>
            <Navbar />
            <Router>
                <Switch>
                    <Route exact path={`${process.env.PUBLIC_URL}/`}>
                        <DocumentList />
                    </Route>
                    <Route exact path={`${process.env.PUBLIC_URL}/editor`}>
                        <Editor />
                    </Route>
                    <Route path={`${process.env.PUBLIC_URL}/editor/:id`}>
                        <Editor />
                    </Route>
                </Switch>
            </Router>
        </>
    );
}

export default App;
