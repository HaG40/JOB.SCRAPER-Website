import { useEffect, useState } from 'react';
import { useContext } from 'react';
import { UserContext } from '../../App';

function CVViewer() {
  const [cvUrl, setCvUrl] = useState(null);
    const { user } = useContext(UserContext);

  useEffect(() => {
    const url = `http://localhost:8888/api/user/cv?id=${user.id}`;
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