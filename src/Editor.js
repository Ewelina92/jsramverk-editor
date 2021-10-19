import React, { useEffect, useState, useRef } from "react";
import { useParams, useHistory } from "react-router-dom";
import { gql, useQuery, useMutation } from '@apollo/client';
import PropTypes from 'prop-types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { saveAs } from 'file-saver';
import { pdfExporter } from 'quill-to-pdf';
import Toolbar from "./Toolbar";
import io from "socket.io-client";
import CommentList from "./CommentList";
import {default as CodeEditor} from "@monaco-editor/react";


const GET_DOCUMENTS = gql`
  query documents {
  documents {
        _id
        title
        content
        kind
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
        comments
        kind
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
  mutation createDocument($title: String!, $content: String!, $comments: String, $kind: String) {
    createDocument(title: $title, content: $content, comments: $comments, kind: $kind) {
      _id
      title
      kind
      content
      comments
    }
  }
`;

const UPDATE_DOCUMENT = gql`
  mutation updateDocument($_id: String!,
    $title: String!, $content: String!, $comments: String, $kind: String) {
    updateDocument(_id: $_id, title: $title, content: $content, comments: $comments, kind: $kind) {
      _id
      title
      kind
      content
      comments
    }
  }
`;


// const ENDPOINT = "http://localhost:1337";
const ENDPOINT = "https://jsramverk-editor-eaja20.azurewebsites.net";

function Editor({ token }) {
    const { id } = useParams(); // grab id
    const [skipLoading, setSkipLoading] = useState(false);
    const [isCodeMode, setCodeMode] = useState(false);
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
    const [comments, setComments] = useState([]);
    const [hideAlert, setHideAlert] = useState(false);
    const [lastDelta, setLastDelta] = useState({});
    const socketRef = useRef();
    const quill = useRef(null);
    const monacoEditor = useRef(null);

    useEffect(() => {
        const socket = io.connect(ENDPOINT);

        socketRef.current = socket;

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
        };
    }, []);

    function handleEditorDidMount(editor) {
        monacoEditor.current = editor;
    }

    const handleEditorChange = (content, delta) => {
        // Ignore the changeEvent if this is the initial content load
        if (!editorValue || isCodeMode) {
            return;
        }

        // update state first
        setEditorValue(content);

        const newDelta = delta.ops.slice(0, -1);
        const oldDelta = quill.current.getEditor().editor.delta.ops;

        let deltasAreSame = false;

        // Is this change the same as the current value of the editor?
        // If deltas are the same, nothing changed so we ignore.
        if (newDelta.length == oldDelta.length) {
            deltasAreSame = true;
            for (let i = 0; i < newDelta.length; i++) {
                if (Object.keys(oldDelta[i]).length !== Object.keys(newDelta[i]).length
                    || Object.keys(oldDelta[i]).every(p => oldDelta[i][p] !== newDelta[i][p])) {
                    deltasAreSame = false;
                    break;
                }
            }
        }
        if (deltasAreSame) {
            return;
        }

        // If our last saved operations are the same, stop
        // This happens on the receiving client and prevents infinite loop
        if (JSON.stringify(lastDelta.ops) ===
            JSON.stringify(delta.ops)) {
            return;
        }

        let from = 0;

        let difference = 0;

        for (const op of delta.ops) {
            if (op.retain) {
                from += op.retain;
            }
            if (op.delete) {
                from += op.delete;
                difference -= op.delete;
            }
            if (op.insert) {
                difference += op.insert.length;
            }
        }

        let commentsClone = [];

        if (comments != null) {
            commentsClone = [...comments];
        }

        for (let i = 0; i < commentsClone.length; i++) {
            if (commentsClone[i].range.index > from) {
                commentsClone[i].range.index = commentsClone[i].range.index + difference;
            }
        }
        setComments(commentsClone);


        // Update our last change
        setLastDelta(delta);

        // Send our new changes
        socketRef.current.emit("doc_content", delta);
    };

    const exportPDF = async () => {
        if (isCodeMode) {
            return;
        }

        // local pdf generation instead of commented out backend route

        const delta = quill.current.getEditor().editor.delta; // get the Quill delta
        const pdfAsBlob = await pdfExporter.generatePdf(delta); // convert to PDF

        saveAs(pdfAsBlob, `${documentTitle}.pdf`); // download from the browser

        // const controller = new AbortController();
        // const signal = controller.signal;

        // fetch(`${ENDPOINT}/pdf`, {
        //     method: "POST",
        //     signal: signal,
        //     // Adding body or contents to send
        //     body: JSON.stringify({
        //         html: quill.current.getEditor().root.innerHTML,
        //     }),
        //     // Adding headers to the request
        //     headers: {
        //         "Content-type": "application/json; charset=UTF-8"
        //     }
        // })
        //     .then(res => res.arrayBuffer())
        //     .then(res => {
        //         const file = new Blob([res], {type: 'application/pdf'});

        //         const fileURL = URL.createObjectURL(file);
        //         const link = document.createElement('a');

        //         link.href = fileURL;
        //         link.download = `${documentTitle}.pdf`;
        //         link.click();
        //     })
        //     .catch((e) => {
        //         console.error(e);
        //     });

        // return function cleanup() {
        //     // cancel fetch
        //     controller.abort();
        // };
    };

    const createComment = async (commentText) => {
        // get selection from quill editor
        const selectionRange = quill.current.getEditorSelection();

        // if no selection, return
        if (!selectionRange || selectionRange.length == 0) {
            return false;
        }

        const ops = [];

        // if selection does not start at beginning of document
        // keep text until selection the way it is
        if (selectionRange.index !== 0) {
            ops.push({ retain: selectionRange.index });
        }

        // create comment object
        const newComment = {
            message: commentText,
            range: selectionRange,
        };

        // send the new comment to other clients
        socketRef.current.emit("new_comment", newComment);

        // the comment's selection gets a yellow background
        ops.push({
            retain: selectionRange.length,
            attributes: {
                background: '#ffffb0',
            },
        });

        // Update state of comments
        await setComments([...comments, newComment]);

        // update editor with operations to turn background yellow
        quill.current.getEditor().updateContents({
            ops: ops,
        });

        return true;
    };

    useEffect(() => {
        if (!id) {
            return;
        }

        // connect to this document's room
        socketRef.current.emit("open", id);

        // subscribe to document changes
        socketRef.current.on("doc_content", function (delta) {
            setLastDelta(delta);
            quill.current.getEditor().updateContents(delta);
        });

        // subscribe to new comments
        socketRef.current.on("new_comment", function (newComment) {
            setComments([...comments, newComment]);
        });

        return function cleanup() {
            // unsubscribe to document changes
            socketRef.current.off('doc_content');
            socketRef.current.off('new_comment');
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
        // if it's not loading and there is data
        if (!loading && !!data) {
            // don't load it again
            setSkipLoading(true);
            setCodeMode((data.document.kind !== "Document"));
            if (data.document.kind !== "Document") {
                setEditorValue(data.document.content);
            } else {
                setEditorValue(JSON.parse(data.document.content));
            }

            try {
                setComments(JSON.parse(data.document.comments));
            } catch (e) {
                setComments([]);
            }
            setDocumentTitle(data.document.title);
        }
    }, [data, loading]);

    if (loading) { return 'Loading...'; }
    if (error) { return `Error! ${error.message}`; }

    function saveDocument() {
        if (!documentTitle || !(editorValue||quill.current.getEditor().editor.delta)) {
            alert("Can't create a document without a title and/or content!");
            return;
        }
        let kind = "Document";

        if (isCodeMode) {
            kind = "Code";
        }

        let content;

        if (isCodeMode) {
            content = monacoEditor.current.getValue();
        } else {
            content = JSON.stringify(quill.current.getEditor().editor.delta);
        }
        if (id) {
            console.log("kind", kind, isCodeMode);
            updateDocument({
                variables: {
                    _id: id,
                    kind: kind,
                    title: documentTitle,
                    content: content,
                    comments: JSON.stringify(comments),
                }
            });
            return;
        }
        createDocument({
            variables: {
                title: documentTitle,
                kind: kind,
                content: content,
                comments: JSON.stringify(comments),
            }
        });
    }

    const setSelection = (range) => {
        quill.current.setEditorSelection(quill.current.getEditor(), range);
    };

    const removeComment = (index) => {
        const selectionRange = comments[index].range;

        if (!selectionRange || selectionRange.length == 0) {
            return;
        }

        const ops = [];

        if (selectionRange.index !== 0) {
            ops.push({ retain: selectionRange.index });
        }

        ops.push({
            retain: selectionRange.length,
            attributes: {
                background: '',
            },
        });

        quill.current.getEditor().updateContents({
            ops: ops,
        });

        let commentsCopy = [...comments];

        commentsCopy.splice(index, 1);
        setComments(commentsCopy);
    };

    const runCode = () => {
        // turn editor value into base64 string
        const data = {
            code: btoa(monacoEditor.current.getValue())
        };

        fetch("https://execjs.emilfolino.se/code", {
            body: JSON.stringify(data),
            headers: {
                'content-type': 'application/json'
            },
            method: 'POST'
        })
            .then(function (response) {
                return response.json();
            })
            .then(function(result) {
                // base64 to regular string
                let decodedOutput = atob(result.data);

                alert(decodedOutput);
            })
            .catch(function(e) {
                console.error(e);
                alert("something went wrong :(");
            });
    };

    return (
        <>
            <Toolbar
                isCodeMode={isCodeMode}
                setCodeMode={setCodeMode}
                save={saveDocument}
                exportPDF={exportPDF}
                comment={createComment}
                runCode={runCode}
                documentID={id}
                token={token}
            />
            <div className={`main-pane codemode-${isCodeMode}`}>
                <div className="content">
                    {(createObj.data || updateObj.data) &&
                        !hideAlert &&
                        <div className="savedDialog">
                            Saved!
                            <span onClick={() => setHideAlert(true)}>X</span>
                        </div>
                    }
                    {(createObj.loading || updateObj.loading) && <div className="savedDialog">
                        Submitting...</div>}
                    <input
                        type="text"
                        placeholder="Document title"
                        value={documentTitle}
                        onChange={(e) => setDocumentTitle(e.target.value)}
                    />
                    { isCodeMode ?
                        <CodeEditor
                            height="inherit"
                            theme="vs-dark"
                            defaultLanguage="javascript"
                            onMount={handleEditorDidMount}
                            value={editorValue}
                            onChange={setEditorValue}
                        />
                        :
                        <ReactQuill
                            ref={quill}
                            theme="snow"
                            value={editorValue}
                            onChange={handleEditorChange}
                        />
                    }
                </div>
                { !isCodeMode &&
                    <CommentList
                        comments={comments}
                        setSelection={setSelection}
                        removeComment={removeComment}
                    />
                }
            </div>
        </>
    );
}

Editor.propTypes = {
    token: PropTypes.string.isRequired,
};

export default Editor;
