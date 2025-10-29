import { UserContext } from "../../App";
import { useContext, createContext, useEffect, useState } from "react";

export const PrefRecommendContext = createContext();

function GetPreferenceJobs() {
  const { user } = useContext(UserContext);
  const [prefRecommendations, setPrefRecommendations] = useState([]);

    useEffect(() => {
        if (user && user.cv){
            setPrefRecommendations(user.interested_job.split(','))
        }

    }, [user.id]);

    return (
        <>
            <PrefRecommendContext.Provider value={prefRecommendations}>
                <div className="flex flex-col gap-4"> 
                    <button className="shadow bg-orange-600 rounded cursor-pointer py-1 px-2 text-white">{prefRecommendations[0]}</button>
                    <button className="shadow bg-orange-600 rounded cursor-pointer py-1 px-2 text-white">{prefRecommendations[1]}</button>
                    <button className="shadow bg-orange-600 rounded cursor-pointer py-1 px-2 text-white">{prefRecommendations[2]}</button>
                </div>
        
            </PrefRecommendContext.Provider>
        </>
    )
}
export default GetPreferenceJobs