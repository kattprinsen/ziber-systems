import { Navbar } from "../../components/layout"

export const ErrorPage = () => {
    return (
        <div>
            <Navbar />
            <div className="min-h-screen flex items-center justify-center text-text-secondary">Page Not Found</div>
        </div>
    )
}