import { IBM_AML, sourceMessage } from '../../utils/datasets';
import './DatasetNotice.css';

/** Source banner shows provenance even when the data is successfully loaded. */
export default function DatasetNotice({ unavailable = false, status = 'nao_importado' }) {
  return <div className={'nl-dataset-notice' + (unavailable ? ' nl-dataset-notice--unavailable' : '')}
    role={unavailable ? 'status' : 'note'}>
    <span aria-hidden="true" className="nl-dataset-notice-icon">{unavailable ? '!' : 'i'}</span>
    <div><strong>{unavailable ? 'Dataset IBM ainda indisponível' : IBM_AML.title}</strong>
      <p>{unavailable ? sourceMessage(status) : 'Fonte única: IBM AML-Data HI-Small, transações sintéticas em USD. O NexusLens calcula as próprias métricas; classificações não comprovam lavagem de dinheiro.'}</p>
    </div>
  </div>;
}
