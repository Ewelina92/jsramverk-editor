import React from "react";
import { useHistory } from "react-router-dom";
import PropTypes from 'prop-types';

function Navbar({ logout, token }) {
    const history = useHistory();

    const handleLogout = () => {
        logout();
        history.push(`${process.env.PUBLIC_URL}/`);
    };

    return (
        <div className="Navbar">
            <div></div>
            <h1>Ewelinas online editor</h1>
            {token
                ?
                <button onClick={handleLogout}>
                    Logout
                </button>
                :
                <div></div>
            }
        </div>
    );
}

Navbar.propTypes = {
    token: PropTypes.string.isRequired,
    logout: PropTypes.func.isRequired,
};

export default Navbar;
