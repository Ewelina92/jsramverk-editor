import React, { useEffect, useState, useRef } from "react";
import { useParams, useHistory } from "react-router-dom";
import { gql, useQuery, useMutation } from '@apollo/client';
import PropTypes from 'prop-types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Toolbar from "./Toolbar";
import io from "socket.io-client";

const GET_DOCUMENTS = gql`
  query documents {
  documents {
        _id
        title
        content
        owner {
            _id
            email
        }
        collaborators {
            _id
            email
        }
    }
  }
`;

const GET_SINGLE_DOCUMENT = gql`
  query document($_id: String!) {
  document(_id: $_id) {
        _id
        title
        content
        owner {
            _id
            email
        }
        collaborators {
            _id
            email
        }
    }
  }
`;

const CREATE_DOCUMENT = gql`
  mutation createDocument($title: String!, $content: String!) {
    createDocument(title: $title, content: $content) {
      _id
      title
      content
    }
  }
`;

const UPDATE_DOCUMENT = gql`
  mutation updateDocument($_id: String!, $title: String!, $content: String!) {
    updateDocument(_id: $_id, title: $title, content: $content) {
      _id
      title
      content
    }
  }
`;


// const ENDPOINT = "http://localhost:1337";
const ENDPOINT = "https://jsramverk-editor-eaja20.azurewebsites.net";

function Editor({ token }) {
    const { id } = useParams(); // grab id
    const [skipLoading, setSkipLoading] = useState(false);
    const history = useHistory();
    const { loading, error, data } = useQuery(GET_SINGLE_DOCUMENT, {
        variables: { _id: id },
        skip: (!id || skipLoading),
    });
    const [createDocument, createObj] = useMutation(CREATE_DOCUMENT, {
        refetchQueries: [{ query: GET_DOCUMENTS }],
    });
    const [updateDocument, updateObj] = useMutation(UPDATE_DOCUMENT, {
        refetchQueries: [{ query: GET_DOCUMENTS }],
    });
    const [editorValue, setEditorValue] = useState('');
    const [documentTitle, setDocumentTitle] = useState('');
    const [hideAlert, setHideAlert] = useState(false);
    const [lastDelta, setLastDelta] = useState({});
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

        console.log("doc_content", delta, socketRef);
    };

    const exportPDF = async () => {
        const controller = new AbortController();
        const signal = controller.signal;

        fetch(`${ENDPOINT}/pdf`, {
            method: "POST",
            signal: signal,
            // Adding body or contents to send
            body: JSON.stringify({
                html: quill.current.getEditor().root.innerHTML,
            }),
            // Adding headers to the request
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
            .then(res => res.arrayBuffer())
            .then(res => {
                const file = new Blob([res], {type: 'application/pdf'});

                const fileURL = URL.createObjectURL(file);
                const link = document.createElement('a');

                link.href = fileURL;
                link.download = `${documentTitle}.pdf`;
                link.click();
            })
            .catch(e => console.log(e));

        return function cleanup() {
            // cancel fetch
            controller.abort();
        };
    };

    useEffect(() => {
        if (!id) {
            return;
        }

        // connect to this document's room
        socketRef.current.emit("open", id);
        console.log("opened", id);

        // subscribe to document changes
        socketRef.current.on("doc_content", function (delta) {
            setLastDelta(delta);
            quill.current.getEditor().updateContents(delta);
        });

        return function cleanup() {
            // unsubscribe to document changes
            socketRef.current.off('doc_content');
        };
    }, [id]);

    useEffect(() => {
        setHideAlert(false);
    }, [createObj.loading, updateObj.loading]);

    useEffect(() => {
        if (createObj.data) {
            history.push(`${process.env.PUBLIC_URL}/editor/${createObj.data.createDocument._id}`);
        }
    }, [createObj.data]);

    useEffect(() => {
        if (!loading && !!data) {
            setSkipLoading(true);
            setEditorValue(JSON.parse(data.document.content));
            setDocumentTitle(data.document.title);
        }
    }, [data, loading]);

    if (loading) { return 'Loading...'; }
    if (error) { return `Error! ${error.message}`; }

    function saveDocument() {
        if (!documentTitle || !JSON.stringify(quill.current.getEditor().editor.delta)) {
            alert("Can't create a document without a title and/or content!");
            return;
        }
        if (id) {
            updateDocument({
                variables: {
                    _id: id,
                    title: documentTitle,
                    content: JSON.stringify(quill.current.getEditor().editor.delta),
                }
            });
            return;
        }
        createDocument({
            variables: {
                title: documentTitle,
                content: JSON.stringify(quill.current.getEditor().editor.delta),
            }
        });
    }

    return (
        <>
            <Toolbar save={saveDocument} exportPDF={exportPDF} documentID={id} token={token} />
            <div className="content">
                {(createObj.data || updateObj.data) &&
                    !hideAlert &&
                    <div>
                        Saved!
                        <span onClick={() => setHideAlert(true)}>X</span>
                    </div>
                }
                {(createObj.loading || updateObj.loading) && <div>Submitting...</div>}
                <input
                    type="text"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                />
                <ReactQuill
                    ref={quill}
                    theme="snow"
                    value={editorValue}
                    onChange={handleEditorChange}
                />
            </div>
        </>
    );
}

Editor.propTypes = {
    token: PropTypes.string.isRequired,
};

export default Editor;
