import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusIcon } from '@heroicons/react/outline'

function DocumentList() {
	const [documentList, setDocumentList] = useState([]);

	// get all documents
	useEffect(() => {
		fetch('https://jsramverk-editor-eaja20.azurewebsites.net/documents')
			.then(res => res.json())
			.then(res => setDocumentList(res));
	});

	return (
		<div className="DocumentList">
			<ul>
				{documentList.map((document, index) =>
					<li key={index}>
						<Link to={`/editor?id=${document._id}`}>{document.title}</Link> {/* send to correct "page" */}
					</li>
				)}
			</ul>
			<Link to="/editor">
				<button className="newButton">
					<PlusIcon />
					Create New Document
				</button>
			</Link>
		</div>
	);
}

export default DocumentList;
