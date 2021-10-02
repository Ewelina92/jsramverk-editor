import React, { useEffect, useState, useRef } from "react";
import { useParams, useHistory } from "react-router-dom";
import { gql, useQuery, useMutation } from '@apollo/client';
import PropTypes from 'prop-types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Toolbar from "./Toolbar";
import io from "socket.io-client";
import CommentList from "./CommentList";

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
        comments
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
  mutation createDocument($title: String!, $content: String!, $comments: String) {
    createDocument(title: $title, content: $content, comments: $comments) {
      _id
      title
      content
      comments
    }
  }
`;

const UPDATE_DOCUMENT = gql`
  mutation updateDocument($_id: String!, $title: String!, $content: String!, $comments: String) {
    updateDocument(_id: $_id, title: $title, content: $content, comments: $comments) {
      _id
      title
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
                    console.log("broken", oldDelta[i], newDelta[i]);
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

        let commentsClone = [...comments];

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

    const createComment = (commentText) => {
        const selectionRange = quill.current.getEditorSelection();

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
                background: '#ffffb0',
            },
        });

        quill.current.getEditor().updateContents({
            ops: ops,
        });

        const newComment = {
            message: commentText,
            range: selectionRange,
        };

        socketRef.current.emit("new_comment", newComment);

        setComments([...comments, newComment]);
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
        if (!loading && !!data) {
            setSkipLoading(true);
            setEditorValue(JSON.parse(data.document.content));
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
                    comments: JSON.stringify(comments),
                }
            });
            return;
        }
        createDocument({
            variables: {
                title: documentTitle,
                content: JSON.stringify(quill.current.getEditor().editor.delta),
                comments: JSON.stringify(comments),
            }
        });
    }

    return (
        <>
            <Toolbar
                save={saveDocument}
                exportPDF={exportPDF}
                comment={createComment}
                documentID={id}
                token={token}
            />
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
            <CommentList comments={comments} />
        </>
    );
}

Editor.propTypes = {
    token: PropTypes.string.isRequired,
};

export default Editor;
