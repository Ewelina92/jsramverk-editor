import React, { useState } from "react";
import { Link } from "react-router-dom";
import { SaveIcon } from '@heroicons/react/outline';
import PropTypes from 'prop-types';

// const ENDPOINT = "http://localhost:1337";
const ENDPOINT = "https://jsramverk-editor-eaja20.azurewebsites.net";

function Toolbar({ save, token, documentID }) {
    const [email, setEmail] = useState("");

    const addCollaborator = () => {
        const controller = new AbortController();
        const signal = controller.signal;

        fetch(`${ENDPOINT}/permissions/${documentID}`, {
            method: "PUT",
            signal: signal,
            // Adding body or contents to send
            body: JSON.stringify({
                email: email,
            }),
            // Adding headers to the request
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "Authorization": `Bearer ${token}`,
            }
        })
            .then(res => res.json())
            .then((res) => {
                console.log(res);
                setEmail("");
                if (res.modifiedCount) {
                    alert("Added new collaborator to the document!");
                }
            })
            .catch(e => console.log(e));

        return function cleanup() {
            // cancel fetch
            controller.abort();
        };
    };

    return (
        <div className="Toolbar">
            <button
                onClick={save}
            >
                <SaveIcon />
                Save
            </button>
            <Link to={`${process.env.PUBLIC_URL}/`}>
                <button>
                    Back to all documents
                </button>
            </Link>
            {
                documentID &&
                <div>
                    <label htmlFor="email">
                        Add collaborator by email:
                    </label>
                    <input className="InputField"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        name="email"
                        type="email"
                    />
                    <input
                        type="button"
                        value="Add"
                        onClick={addCollaborator}
                    />
                </div>
            }
        </div>
    );
}

Toolbar.propTypes = {
    save: PropTypes.func.isRequired,
    token: PropTypes.string.isRequired,
    documentID: PropTypes.string,
};

export default Toolbar;
