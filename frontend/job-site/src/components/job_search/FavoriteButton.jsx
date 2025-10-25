import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function FavoriteButton(props) {
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8888/api/jobs/favorite/check?userId=${props.userId}&url=${encodeURIComponent(props.url)}`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.favorited) {
          setFavorited(true);
        }
      })
      .catch(err => console.log('Check favorite error:', err));
  }, [props.url, props.userId]);

  const toggleFavorite = () => {
    const isAdding = !favorited;
    const apiUrl = isAdding
      ? 'http://localhost:8888/api/jobs/favorite/add'
      : 'http://localhost:8888/api/jobs/favorite/delete';

    fetch(apiUrl, {
      method: isAdding ? 'POST' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: isAdding ? 
      JSON.stringify({
        userId: props.userId,
        title : props.title,
        company : props.company,
        location : props.location,
        salary : props.salary,
        url : props.url,
        source : props.src,      })
        :
      JSON.stringify({
        userId: props.userId,
        url : props.url,    })
    }) 
      .then((res) => {
        if (res.ok) {
          setFavorited(!favorited);
        } else {
          console.log("Favorite action failed");
          toast.warning("โปรดเข้าสู่ระบบเพื่อบันทึกงานที่สนใจ!")
        }
      })
      .catch((err) => console.error('Toggle favorite error:', err));
  };

  return (
    <button onClick={toggleFavorite} className='cursor-pointer'>
      {favorited ? (
        <FaHeart color="red" size={20} />
      ) : (
        <FaRegHeart color="gray" size={20} />
      )}
    </button>
  );
}

export default FavoriteButton;
