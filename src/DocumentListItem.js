import React from "react";
import { Link } from "react-router-dom";

function DocumentListItem({ document }) {
	return (
		<li>
			<Link to={`${process.env.PUBLIC_URL}/editor/${document._id}`}>{document.title}</Link> {/* send to correct "page" */}
		</li>
	);
}

export default DocumentListItem;
