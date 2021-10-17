import React from "react";
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';
import {
    DocumentIcon,
    TerminalIcon
} from '@heroicons/react/outline';

function DocumentListItem({ document }) {
    return (
        <li>
            <Link to={`${process.env.PUBLIC_URL}/editor/${document._id}`}>
                { document.kind == "Document" ?
                    <DocumentIcon /> :
                    <TerminalIcon />
                }
                {document.title}
            </Link> {/* send to correct "page" */}
        </li>
    );
}

DocumentListItem.propTypes = {
    document: PropTypes.shape({
        _id: PropTypes.string,
        title: PropTypes.string,
        kind: PropTypes.string,
    }).isRequired,
};

export default DocumentListItem;
