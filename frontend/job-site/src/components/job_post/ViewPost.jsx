import { useLocation } from 'react-router-dom';

function ViewPost() {

    const location = useLocation();
    const {post} = location.state || {}

    return (
        <>
            <div className='mx-auto max-w-3xl border rounded-xl p-8 mt-5 mb-8 border-gray-300 flex flex-col shadow'>
                <h1>Hello From View Post {post.ID} {post.type}</h1>
            </div>
        </>
    )
}

export default ViewPost