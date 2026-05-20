import { useEffect, useState } from 'react';
import { useContext } from 'react';
import { UserContext } from '../../App';
import { GO_API } from '../../utils/api';

function CVViewer() {
  const [cvUrl, setCvUrl] = useState(null);
    const { user } = useContext(UserContext);

  useEffect(() => {
    const url = `${GO_API}/user/cv?id=${user.id}`;
    setCvUrl(url);
  }, [user.id]);

  if (!cvUrl) return null;

  return (
    <div className="flex flex-row ">
      <label><b>เรซูเม่</b> :</label>
      <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline ml-2">
        ดูไฟล์
      </a>
    </div>
  );
}
export default CVViewer;