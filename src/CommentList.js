import React from 'react';
import PropTypes from 'prop-types';
import { CheckIcon } from '@heroicons/react/solid';

function CommentList({ comments, setSelection, removeComment }) {
    return (
        <ul className="CommentList">
            {comments && comments.sort((a, b) => {
                if (a.range.index > b.range.index) {
                    return 1;
                }
                if (a.range.index < b.range.index) {
                    return -1;
                }
                return 0;
            }).map((comment, index) =>
                <li
                    key={index}
                    onClick={() => setSelection(comment.range)}
                >
                    <span>
                        {comment.message}
                    </span>
                    <button
                        className="comment-check"
                        onClick={() => removeComment(index)}
                    >
                        <CheckIcon/>
                    </button>
                </li>
            )}
        </ul>
    );
}

CommentList.propTypes = {
    comments: PropTypes.array.isRequired,
    setSelection: PropTypes.func.isRequired,
    removeComment: PropTypes.func.isRequired,
};

export default CommentList;

