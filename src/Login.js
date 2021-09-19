import React, { useState } from 'react';
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';
import './Form.css';

// const ENDPOINT = "http://localhost:1337";
const ENDPOINT = "https://jsramverk-editor-eaja20.azurewebsites.net";

function Login({ setToken }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();

        const controller = new AbortController();
        const signal = controller.signal;

        fetch(`${ENDPOINT}/login`, {
            method: "POST",
            signal: signal,
            // Adding body or contents to send
            body: JSON.stringify({
                email: email,
                password: password,
            }),
            // Adding headers to the request
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
            .then(res => res.json())
            .then(({ token }) => {
                console.log("Logged in:", token);
                setToken(token);
                localStorage.setItem('token', token);
            })
            .catch(e => console.log(e));

        return function cleanup() {
            // cancel fetch
            controller.abort();
        };
    };

    return (
        <div className="content">
            <form onSubmit={handleSubmit}>
                <legend>
                    Log in
                    {' or '}
                    <Link to={`${process.env.PUBLIC_URL}/signup`}>
                        <span>
                            create your account
                        </span>
                    </Link>
                </legend>
                <div>
                    <label htmlFor="email">
                        Email:
                    </label>
                    <input className="InputField"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        name="email"
                        type="email"
                    />
                </div>
                <div>
                    <label htmlFor="password">
                        Password:
                    </label>
                    <input className="InputField"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        name="password"
                        type={passwordVisible ? "text" : "password"}
                    />
                    <input
                        type="button"
                        value={passwordVisible ? "Hide password" : "Show password"}
                        onClick={() => setPasswordVisible(!passwordVisible)}
                    />
                </div>
                <input
                    type="submit"
                    value="Login"
                    className="FormButton"
                />
            </form>
        </div>
    );
}

Login.propTypes = {
    setToken: PropTypes.func.isRequired,
};

export default Login;
