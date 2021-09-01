import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Toolbar from "./Toolbar";

function Editor() {
	const [editorValue, setEditorValue] = useState('');
	const [documentTitle, setDocumentTitle] = useState('');

	const { id } = useParams(); // grab id

	// fetch correct document
	useEffect(() => {
		if (!id) {
			return;
		}
		const controller = new AbortController()
    	const signal = controller.signal
		const urlToFetch = `https://jsramverk-editor-eaja20.azurewebsites.net/documents/${id}`;

        fetch(urlToFetch, {
                method: 'get',
                signal: signal,
            })
			.then(res => res.json())
			.then(res => {
				setEditorValue(res.content);
				setDocumentTitle(res.title);
			})
			.catch(e => console.log(e));
		return function cleanup() {
			// cancel fetch
			controller.abort();
		}
	}, [id]);

	function getTitle(e) {
		setDocumentTitle(e.target.value);
	}

	return (
		<>
			<Toolbar title={documentTitle} content={editorValue} />
			<form>
				<input type="text" value={documentTitle} onChange={getTitle} />
			</form>
			<ReactQuill theme="snow" value={editorValue} onChange={setEditorValue} />
		</>

	);
}

export default Editor
