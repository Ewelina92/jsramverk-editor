import React, { useEffect, useState, useRef } from "react";
import { useParams, useHistory } from "react-router-dom";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Toolbar from "./Toolbar";
import io from "socket.io-client";

// const ENDPOINT = "http://192.168.86.247:1337";
const ENDPOINT = "https://jsramverk-editor-eaja20.azurewebsites.net";

function Editor() {
    const [editorValue, setEditorValue] = useState('');
    const [documentTitle, setDocumentTitle] = useState('');
    const [lastDelta, setLastDelta] = useState({});
    const history = useHistory();
    const socketRef = useRef();
    const quill = useRef(null);

    useEffect(() => {
        const socket = io.connect(ENDPOINT);

        socketRef.current = socket;

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
        };
    }, []);

    const { id } = useParams(); // grab id

    const handleEditorChange = (content, delta) => {
        // Ignore the changeEvent if this is the initial content load
        if (!editorValue) {
            return;
        }

        // update state first
        setEditorValue(content);

        // If our last saved operations are the same, stop
        if (JSON.stringify(lastDelta.ops) ===
            JSON.stringify(delta.ops)) {
            return;
        }

        // Update our last change
        setLastDelta(delta);

        // Send our new changes
        socketRef.current.emit("doc_content", delta);
    };

    // fetch correct document
    useEffect(() => {
        if (!id) {
            return;
        }
        const controller = new AbortController();
        const signal = controller.signal;
        const urlToFetch = `${ENDPOINT}/documents/${id}`;

        fetch(urlToFetch, {
            method: 'get',
            signal: signal,
        })
            .then(res => res.json())
            .then(res => {
                setEditorValue(res.content);
                setDocumentTitle(res.title);
            })
            .catch(e => console.log(e));

        // connect to this document's room
        socketRef.current.emit("open", id);
        console.log("opened", id);

        // subscribe to document changes
        socketRef.current.on("doc_content", function (delta) {
            setLastDelta(delta);
            quill.current.getEditor().updateContents(delta);
        });

        return function cleanup() {
            // cancel fetch
            controller.abort();
            // unsubscribe to document changes
            socketRef.current.off('doc_content');
        };
    }, [id]);

    function saveDocument() {
        if (id) {
            updateDocument();
            return;
        }
        createDocument();
    }

    function updateDocument() {
        const newContent = quill.current.getEditor().editor.delta;

        if (!documentTitle || !newContent) {
            alert("Can't save a document without a title and/or content!");
            return;
        }

        const controller = new AbortController();
        const signal = controller.signal;
        const urlToFetch = `${ENDPOINT}/documents/${id}`;

        fetch(urlToFetch, {
            method: "POST",
            signal: signal,
            // Adding body or contents to send
            body: JSON.stringify({
                title: documentTitle,
                content: newContent,
            }),
            // Adding headers to the request
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
            .then(() => {
                alert('Saved! :)');
            })
            .catch(e => console.log(e));
        return function cleanup() {
            // cancel fetch
            controller.abort();
        };
    }

    function createDocument() {
        const newContent = quill.current.getEditor().editor.delta;

        if (!documentTitle || !newContent) {
            alert("Can't create a document without a title and/or content!");
            return;
        }
        const controller = new AbortController();
        const signal = controller.signal;
        const urlToFetch = `${ENDPOINT}/documents`;

        fetch(urlToFetch, {
            method: "PUT",
            signal: signal,
            // Adding body or contents to send
            body: JSON.stringify({
                title: documentTitle,
                content: newContent,
            }),
            // Adding headers to the request
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
            .then(response => response.json())
            .then((data) => {
                history.push(`${process.env.PUBLIC_URL}/editor/${data.documentID}`);
                alert('Saved! :)');
            })
            .catch(e => console.log(e));

        return function cleanup() {
            // cancel fetch
            controller.abort();
        };
    }

    return (
        <>
            <Toolbar save={saveDocument} />
            <form>
                <input
                    type="text"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                />
            </form>
            <ReactQuill
                ref={quill}
                theme="snow"
                value={editorValue}
                onChange={handleEditorChange}
            />
        </>
    );
}

export default Editor;
