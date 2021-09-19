import React, { useState } from 'react';
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
import Login from "./Login";
import Register from "./Register";

function App() {
    const [token, setToken] = useState();

    const logout = () => {
        localStorage.removeItem('token');
        setToken(undefined);
    };

    const storedToken = localStorage.getItem('token');

    if (!token && storedToken) {
        setToken(storedToken);
    }

    return (
        <>
            <Router>
                <Navbar token={token} logout={logout}/>
                <Switch>
                    {token ?
                        <>
                            <Route exact path={`${process.env.PUBLIC_URL}/`}>
                                <DocumentList token={token} />
                            </Route>
                            <Route exact path={`${process.env.PUBLIC_URL}/editor`}>
                                <Editor token={token} />
                            </Route>
                            <Route path={`${process.env.PUBLIC_URL}/editor/:id`}>
                                <Editor token={token} />
                            </Route>
                        </>
                        :
                        <>
                            <Route exact path={`${process.env.PUBLIC_URL}/`}>
                                <Login setToken={setToken} />
                            </Route>
                            <Route path={`${process.env.PUBLIC_URL}/signup`}>
                                <Register />
                            </Route>
                        </>
                    }
                </Switch>
            </Router>
        </>
    );
}

export default App;
