import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { SaveIcon } from '@heroicons/react/outline'

function Toolbar({ title, content }) {

	const { id } = useParams(); // grab id

	function saveDocument() {
		if (id) {
			updateDocument();
			return;
		}
		createDocument();
	}

	function updateDocument() {
		console.log('updating', title, content);
		const controller = new AbortController()
		const signal = controller.signal
		const urlToFetch = `https://jsramverk-editor-eaja20.azurewebsites.net/documents/${id}`;

		fetch(urlToFetch, {
			method: "POST",
			signal: signal,
			// Adding body or contents to send
			body: JSON.stringify({
				title: title,
				content: content
			}),
			// Adding headers to the request
			headers: {
				"Content-type": "application/json; charset=UTF-8"
			}
		})
			.then(res => {
				alert('Saved! :)');
			})
			.catch(e => console.log(e));
		return function cleanup() {
			// cancel fetch
			controller.abort();
		}
	}

	function createDocument() {
		console.log('creating', title, content);
		if (!title || !content) {
			alert("Can't create a document without a title and content!");
			return;
		}
		const controller = new AbortController()
		const signal = controller.signal
		const urlToFetch = `https://jsramverk-editor-eaja20.azurewebsites.net/documents`;

		fetch(urlToFetch, {
			method: "PUT",
			signal: signal,
			// Adding body or contents to send
			body: JSON.stringify({
				title: title,
				content: content
			}),
			// Adding headers to the request
			headers: {
				"Content-type": "application/json; charset=UTF-8"
			}
		})
			.then(res => {
				alert('Saved! :)');
			})
			.catch(e => console.log(e));
		
		return function cleanup() {
			// cancel fetch
			controller.abort();
		}
	}

	return (
		<div className="Toolbar">
			<button
				onClick={saveDocument}
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

export default Toolbar;
