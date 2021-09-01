import { Link } from "react-router-dom";
import { SaveIcon } from '@heroicons/react/outline'

function Toolbar(props) {
	return (
		<div className="Toolbar">
			<button
				onClick={() => console.log(props.value)}
			>
				<SaveIcon />
				Save
			</button>
			<Link to="/">
				<button>
					Back to all documents
				</button>
			</Link>
		</div>
	);
}

export default Toolbar;
