import { SaveIcon } from '@heroicons/react/outline'

function Toolbar(props) {
  return (
    <div className="Toolbar">
        <button
            onClick={() => console.log(props.value)}
        >
        <SaveIcon/>
        Save
        </button>
    </div>
  );
}

export default Toolbar;
