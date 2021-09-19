import React, { useState } from 'react';
import { Link, useHistory } from "react-router-dom";

// const ENDPOINT = "http://localhost:1337";
const ENDPOINT = "https://jsramverk-editor-eaja20.azurewebsites.net";

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const history = useHistory();

    const handleSubmit = (e) => {
        e.preventDefault();

        const controller = new AbortController();
        const signal = controller.signal;

        fetch(`${ENDPOINT}/signup`, {
            method: "PUT",
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
            .then((res) => {
                if (res.errors) {
                    alert(res.errors[0].detail);
                    return;
                }
                history.push(`${process.env.PUBLIC_URL}/`);
                alert(res.message);
            })
            .catch(e => console.log("e", e));

        return function cleanup() {
            // cancel fetch
            controller.abort();
        };
    };

    return (
        <div className="content">
            <form onSubmit={handleSubmit}>
                <legend>
                    Register new account
                    {' or '}
                    <Link to={`${process.env.PUBLIC_URL}/`}>
                        <span>
                            login
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
                <input type="submit" value="Register" className="FormButton"/>
            </form>
        </div>
    );
}


export default Register;
