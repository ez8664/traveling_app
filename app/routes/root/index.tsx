import { redirect } from "react-router";

// Root index route - redirect to sign-in page when server starts
export const loader = () => {
    return redirect('/sign-in');
};

// This component shouldn't render since we always redirect
export default function RootIndex() {
    return null;
}