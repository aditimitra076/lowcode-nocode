import { useParams , Navigate } from "react-router-dom";

function  AuthPage(){

    const {type} = useParams();
    

    return <>
        <h1>This is the {type} page</h1>
    </>

}

export default AuthPage;