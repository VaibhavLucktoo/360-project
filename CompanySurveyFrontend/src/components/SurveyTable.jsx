const surveys = [
    {
        id: 1,
        name: "Employee Feedback",
        department: "HR",
        status: "Active",
        responses: 125,
    },
    {
        id: 2,
        name: "Training Survey",
        department: "IT",
        status: "Draft",
        responses: 0,
    },
    {
        id: 3,
        name: "Customer Satisfaction",
        department: "Marketing",
        status: "Closed",
        responses: 458,
    },
];

function SurveyTable() {
    return (
        <div className="survey-table">
            <table>
                <thead>
                    <tr>
                        <th>Survey Name</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Responses</th>
                    </tr>
                </thead>
                <tbody>
                    {surveys.map((survey) => (
                        <tr key={survey.id}>
                            <td>{survey.name}</td>
                            <td>{survey.department}</td>
                            <td>{survey.status}</td>
                            <td>{survey.responses}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default SurveyTable;
