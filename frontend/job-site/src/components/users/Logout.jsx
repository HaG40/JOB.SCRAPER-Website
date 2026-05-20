import { useEffect } from "react";
import { toast } from 'react-toastify';
import { GO_API } from "../../utils/api";


function Logout(){

    useEffect(() => {
    fetch(`${GO_API}/logout`, { 
        credentials: "include", 
        method: "POST",
        headers : {"Content-Type" : "application/json"}
    })
        .then(async res => {
        if (res.ok) {
            toast.success("ออกจากระบบสำเร็จ", {position: "bottom-center", hideProgressBar: true,})
            console.log("Logged out")
            setTimeout(() => {               
                window.location.replace("/");
            }, 1000);

        } else {
            toast.error("ออกจากระบบไม่สำเร็จ")
            console.log("Failed to logout")
        }
        }
    );
    }, []);

    return (
        <>
        </>

    )
}

export default Logout