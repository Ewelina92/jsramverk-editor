import React from 'react';
import PropTypes from 'prop-types';

function CommentList({ comments }) {
    return (
        <ul className="CommentList">
            {comments.map((comment, index) =>
                <li
                    key={index}
                >
                    {comment.message}
                </li>
            )}
        </ul>
    );
}

CommentList.propTypes = {
    comments: PropTypes.array.isRequired,
};

export default CommentList;

