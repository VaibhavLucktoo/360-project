import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSurvey } from "../services/api";

function CreateSurvey(){
    const navigate = useNavigate();
    const[title, setTitle] = useState("");
    const[description,setDescription] = useState("")
    const[isPublished,setIsPublished] = useState(false)

    async function handleSubmit(e) {

    e.preventDefault();

    if (!title.trim() || !description.trim()) {

        alert("Title and Description are required.");

        return;

    }

    try {

        const survey = await createSurvey({

            title,
            description,
        });
        if (isPublished) await import("../services/api").then(({ publishSurvey }) => publishSurvey(survey.id));
        navigate(`/surveys/${survey.id}/questions`);

    } catch (error) {

        console.error(error);

    }

}

    return(
        <div>
            <h1>Create Survey</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Title</label>

                    <input
                        type='text'
                        value={title}
                        onChange={(e)=> setTitle(e.target.value)}/>

                </div>
                <br/>
                <div>
                    <lable>Description</lable>
                    <textarea
                    value={description}
                    onChange={(e)=>setDescription(e.target.value)}
                    />
                </div>
                <br/>
                <div>
                    <label>
                        <input 
                            type='checkbox'
                            checked={isPublished}
                            onChange={(e)=> setIsPublished(e.target.checked)}
                            />
                            Published
                    </label>
                </div>
                <br/>
                <button type='submit'>
                    Create Survey
                </button>
            </form>
        </div>
    );

}


export default CreateSurvey;
