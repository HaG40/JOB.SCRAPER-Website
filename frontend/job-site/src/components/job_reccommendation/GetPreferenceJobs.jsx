import { UserContext } from "../../App";
import { useContext, useEffect, useState } from "react";
import GetRecommendJob from "./GetRecomendJob";

function GetPreferenceJobs() {
  const { user } = useContext(UserContext);
  const [prefRecommendations, setPrefRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        setIsLoading(true)
        try {
            if (user && user.interested_job){
                setPrefRecommendations(user.interested_job.split(','))
            }    
        }  finally {
            setIsLoading(false)
        }
    }, []);

    return (
        <>
            {!isLoading && prefRecommendations.length > 0 ? 
                <> 
                    {prefRecommendations.length > 0 && !isLoading &&  prefRecommendations.length > 0 && (
                        <GetRecommendJob recommend={prefRecommendations} />
                    )}
                </>
            :
                <p className="animate-spin rounded-full h-4 w-4 border-t-white border-1 border-gray-500 ml-2"></p>
            }

        </>
    )
}
export default GetPreferenceJobs