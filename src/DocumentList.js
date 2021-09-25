import React from "react";
import { Link } from "react-router-dom";
import { gql, useQuery } from '@apollo/client';
import { PlusIcon } from '@heroicons/react/outline';
import DocumentListItem from "./DocumentListItem";

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

function DocumentList() {
    const { loading, error, data } = useQuery(GET_DOCUMENTS);

    if (loading) { return 'Loading...'; }
    if (error) { return `Error! ${error.message}`; }

    return (
        <div className="DocumentList">
            <h2>Your documents</h2>
            <ul>
                {data.documents.map((document, index) =>
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

export default DocumentList;
