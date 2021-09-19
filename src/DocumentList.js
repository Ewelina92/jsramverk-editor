import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';
import { PlusIcon } from '@heroicons/react/outline';
import DocumentListItem from "./DocumentListItem";

function DocumentList({ token }) {
    const [documentList, setDocumentList] = useState([]);

    // const ENDPOINT = "http://localhost:1337";
    const ENDPOINT = "https://jsramverk-editor-eaja20.azurewebsites.net";

    // get all documents
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        const urlToFetch = `${ENDPOINT}/documents`;

        fetch(urlToFetch, {
            method: 'get',
            signal: signal,
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(res => setDocumentList(res))
            .catch(e => console.log(e));
        return function cleanup() {
            // cancel fetch
            controller.abort();
        };
    }, []);

    return (
        <div className="DocumentList">
            <h2>Your documents</h2>
            <ul>
                {documentList.map((document, index) =>
                    <DocumentListItem key={index} document={document} />
                )}
            </ul>
            <Link to={`${process.env.PUBLIC_URL}/editor`}>
                <button className="newButton">
                    <PlusIcon />
					Create New Document
                </button>
            </Link>
        </div>
    );
}

DocumentList.propTypes = {
    token: PropTypes.string.isRequired,
};

export default DocumentList;
