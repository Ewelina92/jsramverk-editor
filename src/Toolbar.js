import React, { useState, useEffect } from "react";
import { gql, useMutation } from '@apollo/client';
import { Link } from "react-router-dom";
import { CloudUploadIcon, DocumentDownloadIcon, ChatAltIcon } from '@heroicons/react/outline';
import PropTypes from 'prop-types';

const ADD_COLLABORATOR = gql`
  mutation addCollaborator($documentId: String!, $email: String!) {
    addCollaborator(documentId: $documentId, email: $email) {
      _id
    }
  }
`;

function Toolbar({ save, exportPDF, comment, documentID }) {
    const [email, setEmail] = useState("");
    const [commentText, setCommentText] = useState("");
    const [hideAlert, setHideAlert] = useState(false);
    const [addCollaborator, { data, loading }] = useMutation(ADD_COLLABORATOR);

    useEffect(() => {
        setHideAlert(false);
    }, [loading]);

    return (
        <div className="Toolbar">
            <button
                onClick={save}
            >
                <CloudUploadIcon />
                Save
            </button>
            <button
                onClick={exportPDF}
            >
                <DocumentDownloadIcon/>
                Export to PDF
            </button>
            <div>
                <input className="InputField"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    name="comment"
                    type="comment"
                    placeholder="First write, then select the text"
                />
            </div>
            <button
                onClick={e => {
                    e.preventDefault();
                    if (comment(commentText)) {
                        setCommentText("");
                    } else {
                        alert("Write the comment text first, then select where you"+
                        " want the comment to appear and click the comment button");
                    }
                }}
            >
                <ChatAltIcon/>
                Comment
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
                        onClick={e => {
                            e.preventDefault();
                            addCollaborator({
                                variables: {
                                    documentId: documentID,
                                    email: email
                                }
                            });
                            setEmail("");
                        }}
                    />
                    {loading &&
                    <span>
                        Submitting...
                    </span>
                    }
                    {data &&
                    !hideAlert &&
                    <div>
                        Added collaborator!
                        <span onClick={() => setHideAlert(true)}>X</span>
                    </div>
                    }
                </div>
            }
        </div>
    );
}

Toolbar.propTypes = {
    save: PropTypes.func.isRequired,
    exportPDF: PropTypes.func.isRequired,
    comment: PropTypes.func.isRequired,
    documentID: PropTypes.string,
};

export default Toolbar;
