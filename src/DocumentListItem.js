import React from "react";
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';

function DocumentListItem({ document }) {
    return (
        <li>
            <Link to={`${process.env.PUBLIC_URL}/editor/${document._id}`}>
                {document.title}
            </Link> {/* send to correct "page" */}
        </li>
    );
}

DocumentListItem.propTypes = {
    document: PropTypes.shape({
        _id: PropTypes.string,
        title: PropTypes.string,
    }).isRequired,
};

export default DocumentListItem;
