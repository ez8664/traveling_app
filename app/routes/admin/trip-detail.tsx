import type { LoaderFunctionArgs } from "react-router";

export const loader = async({ params }: LoaderFunctionArgs) => {
    // your loader logic here
};

const TripDetail = () => {
    return (
        <div>TripDetail</div>
    )
}

export default TripDetail