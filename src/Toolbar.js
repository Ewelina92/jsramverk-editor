import React from "react";
import { Link } from "react-router-dom";
import { SaveIcon } from '@heroicons/react/outline';
import PropTypes from 'prop-types';

function Toolbar({ save }) {
    return (
        <div className="Toolbar">
            <button
                onClick={save}
            >
                <SaveIcon />
				Save
            </button>
            <Link to={`${process.env.PUBLIC_URL}/`}>
                <button>
					Back to all documents
                </button>
            </Link>
        </div>
    );
}

Toolbar.propTypes = {
    save: PropTypes.func.isRequired,
};

export default Toolbar;
